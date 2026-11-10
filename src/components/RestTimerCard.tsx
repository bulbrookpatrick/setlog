import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "./ui";
import { colors, radius, spacing } from "@/theme/colors";
import { formatClock } from "@/lib/format";
import type { RestTimer } from "@/lib/use-rest-timer";

export function RestTimerCard({ timer }: { timer: RestTimer }) {
  const done = timer.remaining === 0;
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>REST TIMER</Text>
        <Text style={styles.hint}>{timer.running ? "Counting down" : done ? "Rest complete" : "Paused"}</Text>
      </View>

      <View style={styles.clockRow}>
        <Text style={[styles.clock, done && styles.clockDone]}>{formatClock(timer.remaining)}</Text>
        <View style={styles.controls}>
          <TimerButton icon="remove" onPress={() => timer.adjust(-30)} label="Subtract 30 seconds" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={timer.running ? "Pause rest timer" : "Start rest timer"}
            onPress={timer.toggle}
            style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons
              name={timer.running ? "pause" : "play"}
              size={20}
              color={colors.accentInk}
              style={timer.running ? undefined : { marginLeft: 2 }}
            />
          </Pressable>
          <TimerButton icon="add" onPress={() => timer.adjust(30)} label="Add 30 seconds" />
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(timer.progress * 100)}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.caption}>Auto-starts when you log a set.</Text>
        <Pressable onPress={timer.reset} hitSlop={8} accessibilityLabel="Reset rest timer">
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function TimerButton({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.timerButton, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icon} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clock: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.6,
    fontVariant: ["tabular-nums"],
  },
  clockDone: {
    color: colors.accent,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caption: {
    color: colors.textDim,
    fontSize: 11,
  },
  reset: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
});
