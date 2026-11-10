import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";
import { EXERCISES, formatRpe, formatTime, formatWeight } from "@/lib/format";
import type { SetEntry } from "@/lib/types";

export function SetRow({
  entry,
  onDelete,
  compact = false,
}: {
  entry: SetEntry;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  const exercise = EXERCISES.find((item) => item.name === entry.exercise);
  const short = exercise?.short ?? entry.exercise.slice(0, 2).toUpperCase();
  const volume = entry.weight * entry.reps;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{short}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.exercise} numberOfLines={1}>
          {entry.exercise}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatWeight(entry.weight)} kg × {entry.reps} · RPE {formatRpe(entry.rpe)}
          {compact ? "" : ` · ${formatTime(entry.performed_at)}`}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.volume}>{Math.round(volume)} kg</Text>
        {entry.synced ? (
          <Ionicons name="cloud-done-outline" size={13} color={colors.success} />
        ) : (
          <Text style={styles.local}>LOCAL</Text>
        )}
      </View>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${entry.exercise} set`}
          onPress={() => onDelete(entry.id)}
          hitSlop={10}
          style={({ pressed }) => [styles.delete, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textDim} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowCompact: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#31451A",
  },
  badgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  exercise: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  right: {
    alignItems: "flex-end",
    gap: 3,
    minWidth: 58,
  },
  volume: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  local: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  delete: {
    paddingLeft: spacing.xs,
  },
});
