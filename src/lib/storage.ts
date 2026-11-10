import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SetEntry, SupabaseConfig } from "./types";

const SETS_KEY = "setlog.sets.v1";
const CONFIG_KEY = "setlog.supabase.v1";

export async function loadSets(): Promise<SetEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSetEntry);
  } catch {
    return [];
  }
}

export async function saveSets(sets: SetEntry[]): Promise<void> {
  await AsyncStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export async function loadConfig(): Promise<SupabaseConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.url === "string" &&
      typeof parsed?.anonKey === "string" &&
      parsed.url.length > 0 &&
      parsed.anonKey.length > 0
    ) {
      return { url: parsed.url, anonKey: parsed.anonKey };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveConfig(config: SupabaseConfig): Promise<void> {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function clearConfig(): Promise<void> {
  await AsyncStorage.removeItem(CONFIG_KEY);
}

export async function clearSets(): Promise<void> {
  await AsyncStorage.removeItem(SETS_KEY);
}

function isSetEntry(value: unknown): value is SetEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.exercise === "string" &&
    typeof v.weight === "number" &&
    typeof v.reps === "number" &&
    typeof v.rpe === "number" &&
    typeof v.performed_at === "string" &&
    typeof v.created_at === "string" &&
    typeof v.synced === "boolean"
  );
}
