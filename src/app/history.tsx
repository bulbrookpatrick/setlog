import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SetRow } from "@/components/SetRow";
import {
  BrandHeader,
  Card,
  EmptyState,
  ErrorBanner,
  Screen,
  SectionTitle,
  Stat,
  StatusPill,
} from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { formatDayKey, formatDayLabel, formatVolume } from "@/lib/format";
import type { SetEntry } from "@/lib/types";
import { colors, spacing } from "@/theme/colors";

type DayGroup = {
  key: string;
  label: string;
  volume: number;
  sets: SetEntry[];
};

export default function HistoryScreen() {
  const { sets, removeSet, status, isSyncing, syncNow, error, dismissError, config } = useApp();

  const groups = useMemo<DayGroup[]>(() => {
    const byDay = new Map<string, SetEntry[]>();
    for (const entry of sets) {
      const key = formatDayKey(entry.performed_at);
      const list = byDay.get(key);
      if (list) {
        list.push(entry);
      } else {
        byDay.set(key, [entry]);
      }
    }

    return [...byDay.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => {
        const ordered = [...list].sort((a, b) => b.performed_at.localeCompare(a.performed_at));
        return {
          key,
          label: formatDayLabel(ordered[0].performed_at),
          volume: ordered.reduce((total, entry) => total + entry.weight * entry.reps, 0),
          sets: ordered,
        };
      });
  }, [sets]);

  const totalVolume = sets.reduce((total, entry) => total + entry.weight * entry.reps, 0);
  const totalReps = sets.reduce((total, entry) => total + entry.reps, 0);
  const bestSet = sets.reduce((best, entry) => Math.max(best, entry.weight), 0);

  return (
    <Screen refreshing={isSyncing} onRefresh={() => void syncNow()}>
      <BrandHeader
        title="History"
        subtitle="Every set, saved offline first."
        right={<StatusPill status={status} />}
      />

      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}

      <Card>
        <View style={styles.statRow}>
          <Stat label="TOTAL SETS" value={String(sets.length)} />
          <Stat label="TOTAL VOLUME" value={formatVolume(totalVolume)} unit="kg" align="right" />
        </View>
        <View style={styles.rule} />
        <View style={styles.statRow}>
          <Stat label="REPS LOGGED" value={String(totalReps)} />
          <Stat label="HEAVIEST SET" value={bestSet > 0 ? String(bestSet) : "—"} unit={bestSet > 0 ? "kg" : undefined} align="right" />
        </View>
      </Card>

      {sets.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Nothing logged yet"
          body="Sets you log on the Log tab show up here, grouped by day. Pull down to sync when Supabase is connected."
        />
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <SectionTitle
              right={
                <Text style={styles.groupMeta}>
                  {group.sets.length} {group.sets.length === 1 ? "set" : "sets"} ·{" "}
                  {formatVolume(group.volume)} kg
                </Text>
              }
            >
              {group.label}
            </SectionTitle>
            <Card style={styles.groupCard}>
              {group.sets.map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <SetRow entry={entry} onDelete={removeSet} compact />
                </View>
              ))}
            </Card>
          </View>
        ))
      )}

      {sets.length > 0 ? (
        <Text style={styles.footerNote}>
          {config
            ? "Pull down to push local sets and pull remote changes."
            : "Connect Supabase in Settings to sync this history to your project."}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  rule: {
    height: 1,
    backgroundColor: colors.border,
  },
  group: {
    gap: spacing.xs,
  },
  groupCard: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  groupMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  footerNote: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
