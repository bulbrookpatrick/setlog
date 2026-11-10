export type SetEntry = {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  rpe: number;
  performed_at: string;
  created_at: string;
  synced: boolean;
};

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SyncStatus = "local" | "syncing" | "error" | "connected";

export type SyncResult = {
  merged: SetEntry[];
  pushed: number;
  pulled: number;
};
