import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RestTimerCard } from "@/components/RestTimerCard";
import { SetRow } from "@/components/SetRow";
import {
  BrandHeader,
  Card,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  Screen,
  SectionTitle,
  Stat,
  StatusPill,
} from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { EXERCISES, RPE_OPTIONS, formatDayKey, formatRpe, formatVolume } from "@/lib/format";
import { useRestTimer } from "@/lib/use-rest-timer";
import { colors, radius, spacing } from "@/theme/colors";

export default function LogScreen() {
  const { sets, addSet, removeSet, status, error, dismissError, isSyncing, syncNow } = useApp();
  const timer = useRestTimer(90);
  const [exercise, setExercise] = useState<string>(EXERCISES[0].name);
  const [weightText, setWeightText] = useState("135");
  const [repsText, setRepsText] = useState("5");
  const [rpe, setRpe] = useState(8);
  const [logged, setLogged] = useState(false);
  const loggedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayKey = formatDayKey(new Date().toISOString());
  const todaySets = useMemo(
    () => sets.filter((entry) => formatDayKey(entry.performed_at) === todayKey),
    [sets, todayKey],
  );

  const volume = todaySets.reduce((total, entry) => total + entry.weight * entry.reps, 0);
  const avgRpe =
    todaySets.length > 0
      ? todaySets.reduce((total, entry) => total + entry.rpe, 0) / todaySets.length
      : 0;
  const exerciseCount = new Set(todaySets.map((entry) => entry.exercise)).size;

  const weight = Number(weightText.replace(",", "."));
  const reps = Number(repsText);
  const valid = Number.isFinite(weight) && weight > 0 && Number.isFinite(reps) && reps > 0;

  function handleLog() {
    if (!valid) return;
    addSet({ exercise, weight, reps, rpe });
    timer.start(90);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setLogged(true);
    if (loggedTimer.current) clearTimeout(loggedTimer.current);
    loggedTimer.current = setTimeout(() => setLogged(false), 1400);
  }

  return (
    <Screen refreshing={isSyncing} onRefresh={() => void syncNow()}>
      <BrandHeader
        title="Log a set"
        subtitle={`${new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}`}
        right={<StatusPill status={status} />}
      />

      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}

      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <Stat label="TODAY'S VOLUME" value={formatVolume(volume)} unit="kg" />
          <Stat label="SETS" value={String(todaySets.length)} align="right" />
        </View>
        <View style={styles.heroRule} />
        <View style={styles.heroRow}>
          <Stat label="AVG RPE" value={avgRpe > 0 ? formatRpe(avgRpe) : "—"} />
          <Stat label="EXERCISES" value={String(exerciseCount)} align="right" />
        </View>
      </Card>

      <SectionTitle>Exercise</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {EXERCISES.map((item) => {
          const active = exercise === item.name;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setExercise(item.name)}
              style={({ pressed }) => [
                styles.exerciseChip,
                active && styles.exerciseChipActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.exerciseShort, active && styles.exerciseShortActive]}>
                {item.short}
              </Text>
              <Text style={[styles.exerciseName, active && styles.exerciseNameActive]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card style={styles.form}>
        <View style={styles.inputRow}>
          <NumberField
            label="WEIGHT"
            unit="kg"
            value={weightText}
            onChangeText={setWeightText}
            accessibilityLabel="Weight in kilograms"
          />
          <View style={styles.inputDivider} />
          <NumberField
            label="REPS"
            unit="reps"
            value={repsText}
            onChangeText={setRepsText}
            accessibilityLabel="Repetitions"
          />
        </View>

        <View style={styles.rpeHeader}>
          <Text style={styles.fieldLabel}>RPE</Text>
          <Text style={styles.fieldHint}>How hard was the set?</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rpeRow}
        >
          {RPE_OPTIONS.map((option) => {
            const active = option === rpe;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`RPE ${option}`}
                onPress={() => setRpe(option)}
                style={({ pressed }) => [
                  styles.rpeChip,
                  active && styles.rpeChipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.rpeText, active && styles.rpeTextActive]}>
                  {formatRpe(option)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <PrimaryButton
          label={logged ? "Logged" : "Log set"}
          icon={logged ? "checkmark" : "add"}
          onPress={handleLog}
          disabled={!valid}
        />
      </Card>

      <RestTimerCard timer={timer} />

      <SectionTitle
        right={
          <Text style={styles.countLabel}>
            {todaySets.length} {todaySets.length === 1 ? "set" : "sets"}
          </Text>
        }
      >
        Today
      </SectionTitle>

      {todaySets.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No sets yet"
          body="Log your first set above. It saves on this device and syncs when Supabase is connected."
        />
      ) : (
        <View style={styles.setList}>
          {todaySets.map((entry) => (
            <SetRow key={entry.id} entry={entry} onDelete={removeSet} />
          ))}
        </View>
      )}

      <Text style={styles.footerNote}>
        Offline-first demo. {status === "connected" ? "Synced to Supabase." : "Data stays on this device until you connect Supabase in Settings."}
      </Text>
    </Screen>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChangeText,
  accessibilityLabel,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.numberInputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel}
          style={styles.numberInput}
          placeholderTextColor={colors.textDim}
        />
        <Text style={styles.numberUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  heroRule: {
    height: 1,
    backgroundColor: colors.border,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  exerciseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  exerciseShort: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  exerciseShortActive: {
    color: colors.accent,
  },
  exerciseName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  exerciseNameActive: {
    color: colors.text,
  },
  form: {
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberField: {
    flex: 1,
    gap: 6,
  },
  inputDivider: {
    width: 1,
    height: 52,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  fieldLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  fieldHint: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "500",
  },
  numberInputRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  numberInput: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    padding: 0,
    minWidth: 80,
  },
  numberUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  rpeHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  rpeRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  rpeChip: {
    width: 44,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rpeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rpeText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  rpeTextActive: {
    color: colors.accentInk,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  setList: {
    gap: spacing.sm,
  },
  footerNote: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
