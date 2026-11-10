import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  configureSupabase,
  disconnectSupabase,
  getSupabase,
  signOut,
  syncWithSupabase,
  testConnection,
} from "./supabase";
import {
  clearConfig,
  clearSets,
  loadConfig,
  loadSets,
  saveConfig,
  saveSets,
} from "./storage";
import { newId, nowIso } from "./format";
import type { SetEntry, SupabaseConfig, SyncStatus } from "./types";

export type NewSetInput = {
  exercise: string;
  weight: number;
  reps: number;
  rpe: number;
};

type AppContextValue = {
  ready: boolean;
  sets: SetEntry[];
  config: SupabaseConfig | null;
  status: SyncStatus;
  isSyncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
  addSet: (input: NewSetInput) => void;
  removeSet: (id: string) => void;
  syncNow: () => Promise<void>;
  connect: (config: SupabaseConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  clearLocal: () => Promise<void>;
  dismissError: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}

function readEnvConfig(): SupabaseConfig | null {
  const env = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const url = env?.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env?.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = useState<SetEntry[]>([]);
  const setsRef = useRef<SetEntry[]>([]);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  const configRef = useRef<SupabaseConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateSets = useCallback((next: SetEntry[]) => {
    setsRef.current = next;
    setSets(next);
    void saveSets(next).catch(() => undefined);
  }, []);

  const runSync = useCallback(
    async (source?: SetEntry[]) => {
      if (!configRef.current || syncingRef.current) return;
      syncingRef.current = true;
      setIsSyncing(true);
      setError(null);
      try {
        const result = await syncWithSupabase(source ?? setsRef.current);
        updateSets(result.merged);
        setLastSyncAt(new Date().toISOString());
      } catch (syncError) {
        setError(messageOf(syncError));
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [updateSets],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedSets, storedConfig] = await Promise.all([loadSets(), loadConfig()]);
      if (!mounted) return;
      updateSets(storedSets);

      const envConfig = readEnvConfig();
      const effectiveConfig = storedConfig ?? envConfig;
      if (effectiveConfig) {
        configRef.current = effectiveConfig;
        setConfig(effectiveConfig);
        configureSupabase(effectiveConfig);
      }
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [updateSets]);

  useEffect(() => {
    if (!ready || !configRef.current) return;
    void runSync();
  }, [ready, runSync]);

  const addSet = useCallback(
    (input: NewSetInput) => {
      const timestamp = nowIso();
      const entry: SetEntry = {
        id: newId(),
        exercise: input.exercise,
        weight: input.weight,
        reps: input.reps,
        rpe: input.rpe,
        performed_at: timestamp,
        created_at: timestamp,
        synced: false,
      };
      const next = [entry, ...setsRef.current];
      updateSets(next);
      if (configRef.current) {
        void runSync(next);
      }
    },
    [runSync, updateSets],
  );

  const removeSet = useCallback(
    (id: string) => {
      const next = setsRef.current.filter((entry) => entry.id !== id);
      updateSets(next);
      const supabase = getSupabase();
      if (supabase) {
        void supabase
          .from("sets")
          .delete()
          .eq("id", id)
          .then(({ error: deleteError }) => {
            if (deleteError) setError(deleteError.message);
          });
      }
    },
    [updateSets],
  );

  const connect = useCallback(
    async (nextConfig: SupabaseConfig) => {
      setError(null);
      configureSupabase(nextConfig);
      try {
        await testConnection();
      } catch (connectionError) {
        disconnectSupabase();
        throw connectionError;
      }
      await saveConfig(nextConfig);
      configRef.current = nextConfig;
      setConfig(nextConfig);
      await runSync();
    },
    [runSync],
  );

  const disconnect = useCallback(async () => {
    await signOut().catch(() => undefined);
    disconnectSupabase();
    await clearConfig();
    configRef.current = null;
    setConfig(null);
    setLastSyncAt(null);
    setError(null);
  }, []);

  const clearLocal = useCallback(async () => {
    await clearSets();
    updateSets([]);
  }, [updateSets]);

  const status: SyncStatus = !config
    ? "local"
    : isSyncing
      ? "syncing"
      : error
        ? "error"
        : lastSyncAt
          ? "connected"
          : "local";

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      sets,
      config,
      status,
      isSyncing,
      lastSyncAt,
      error,
      addSet,
      removeSet,
      syncNow: () => runSync(),
      connect,
      disconnect,
      clearLocal,
      dismissError: () => setError(null),
    }),
    [
      ready,
      sets,
      config,
      status,
      isSyncing,
      lastSyncAt,
      error,
      addSet,
      removeSet,
      runSync,
      connect,
      disconnect,
      clearLocal,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return value;
}
