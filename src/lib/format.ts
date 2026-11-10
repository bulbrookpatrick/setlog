import { Platform } from "react-native";

export const EXERCISES = [
  { name: "Squat", short: "SQ" },
  { name: "Bench Press", short: "BP" },
  { name: "Deadlift", short: "DL" },
  { name: "Overhead Press", short: "OHP" },
  { name: "Barbell Row", short: "ROW" },
] as const;

export const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

export function newId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatWeight(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatRpe(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k`;
  }
  return String(Math.round(kg));
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (formatDayKey(iso) === formatDayKey(today.toISOString())) {
    return "Today";
  }
  if (formatDayKey(iso) === formatDayKey(yesterday.toISOString())) {
    return "Yesterday";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isWeb(): boolean {
  return Platform.OS === "web";
}
