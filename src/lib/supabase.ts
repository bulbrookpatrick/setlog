import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SetEntry, SupabaseConfig, SyncResult } from "./types";

let client: SupabaseClient | null = null;
let activeConfig: SupabaseConfig | null = null;

export function getSupabase(): SupabaseClient | null {
  return client;
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}

export function getActiveConfig(): SupabaseConfig | null {
  return activeConfig;
}

export function configureSupabase(config: SupabaseConfig): SupabaseClient {
  if (client && activeConfig?.url === config.url && activeConfig?.anonKey === config.anonKey) {
    return client;
  }
  client = createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  activeConfig = config;
  return client;
}

export function disconnectSupabase(): void {
  client = null;
  activeConfig = null;
}

export async function ensureSession(): Promise<SupabaseClient> {
  if (!client) {
    throw new Error("Supabase is not configured yet.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (session) return client;

  const { error } = await client.auth.signInAnonymously();
  if (error) {
    throw new Error(
      `Anonymous sign-in failed. Enable anonymous sign-ins in Supabase Auth settings. (${error.message})`,
    );
  }
  return client;
}

export async function testConnection(): Promise<void> {
  const supabase = await ensureSession();
  const { error } = await supabase.from("sets").select("id").limit(1);
  if (error) {
    if (error.code === "42P01") {
      throw new Error("The `sets` table does not exist. Run supabase/schema.sql in the SQL editor.");
    }
    throw error;
  }
}

export async function syncWithSupabase(localSets: SetEntry[]): Promise<SyncResult> {
  const supabase = await ensureSession();
  const unsynced = localSets.filter((entry) => !entry.synced);

  if (unsynced.length > 0) {
    const rows = unsynced.map((entry) => ({
      id: entry.id,
      exercise: entry.exercise,
      weight: entry.weight,
      reps: entry.reps,
      rpe: entry.rpe,
      performed_at: entry.performed_at,
      created_at: entry.created_at,
    }));
    const { error } = await supabase.from("sets").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  const pushedIds = new Set(unsynced.map((entry) => entry.id));
  const localMarked = localSets.map((entry) =>
    pushedIds.has(entry.id) ? { ...entry, synced: true } : entry,
  );

  const { data, error } = await supabase
    .from("sets")
    .select("id,exercise,weight,reps,rpe,performed_at,created_at")
    .order("performed_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const remote = (data ?? []).map(toSetEntry);
  const merged = mergeSets(localMarked, remote);

  return {
    merged,
    pushed: unsynced.length,
    pulled: remote.length,
  };
}

export async function signOut(): Promise<void> {
  if (!client) return;
  await client.auth.signOut();
}

function toSetEntry(row: Record<string, unknown>): SetEntry {
  return {
    id: String(row.id),
    exercise: String(row.exercise),
    weight: Number(row.weight),
    reps: Number(row.reps),
    rpe: Number(row.rpe),
    performed_at: String(row.performed_at),
    created_at: String(row.created_at),
    synced: true,
  };
}

export function mergeSets(local: SetEntry[], remote: SetEntry[]): SetEntry[] {
  const byId = new Map<string, SetEntry>();
  for (const entry of remote) {
    byId.set(entry.id, { ...entry, synced: true });
  }
  for (const entry of local) {
    const existing = byId.get(entry.id);
    byId.set(entry.id, {
      ...(existing ?? entry),
      ...entry,
      synced: entry.synced || Boolean(existing),
    });
  }
  return [...byId.values()].sort((a, b) => b.performed_at.localeCompare(a.performed_at));
}
