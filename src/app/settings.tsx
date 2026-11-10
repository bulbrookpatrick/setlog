import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  BrandHeader,
  Card,
  ErrorBanner,
  PrimaryButton,
  Screen,
  SectionTitle,
  SecondaryButton,
  StatusPill,
} from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { colors, radius, spacing } from "@/theme/colors";

export default function SettingsScreen() {
  const {
    config,
    sets,
    status,
    isSyncing,
    lastSyncAt,
    error,
    dismissError,
    connect,
    disconnect,
    clearLocal,
    syncNow,
  } = useApp();

  const [urlText, setUrlText] = useState(config?.url ?? "");
  const [keyText, setKeyText] = useState(config?.anonKey ?? "");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const unsynced = sets.filter((entry) => !entry.synced).length;

  async function handleConnect() {
    const url = urlText.trim().replace(/\/+$/, "");
    const anonKey = keyText.trim();

    if (!/^https?:\/\/[^\s]+$/i.test(url)) {
      setFormError("Enter the full project URL, for example https://abcd1234.supabase.co");
      return;
    }
    if (anonKey.length < 20) {
      setFormError("Paste the anon public key from Project Settings → API.");
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      await connect({ url, anonKey });
    } catch (connectError) {
      setFormError(
        connectError instanceof Error ? connectError.message : "Could not connect to Supabase.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnect();
      setUrlText("");
      setKeyText("");
      setFormError(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    await clearLocal();
    setConfirmClear(false);
  }

  return (
    <Screen>
      <BrandHeader
        title="Settings"
        subtitle="Local-first by default. Supabase is optional."
        right={<StatusPill status={status} />}
      />

      {error ? <ErrorBanner message={error} onDismiss={dismissError} /> : null}

      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <Ionicons name="cloud-outline" size={18} color={colors.accent} />
            <Text style={styles.cardTitle}>Sync</Text>
          </View>
          <Text style={styles.mono}>{unsynced} unsynced</Text>
        </View>
        <Text style={styles.body}>
          {config
            ? `Connected to ${shortUrl(config.url)}. ${
                lastSyncAt ? `Last sync ${formatStamp(lastSyncAt)}.` : "Waiting for the first sync."
              }`
            : "Not connected. Sets are stored on this device only until you add a Supabase project."}
        </Text>
        {config ? (
          <SecondaryButton
            label={isSyncing ? "Syncing…" : "Sync now"}
            icon="refresh"
            onPress={() => void syncNow()}
          />
        ) : null}
      </Card>

      <SectionTitle>Supabase connection</SectionTitle>

      {config ? (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>PROJECT URL</Text>
            <View style={styles.connectedTag}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>CONNECTED</Text>
            </View>
          </View>
          <Text style={styles.valueText}>{config.url}</Text>
          <View style={styles.rule} />
          <Text style={styles.fieldLabel}>ANON KEY</Text>
          <Text style={styles.valueText}>{maskKey(config.anonKey)}</Text>
          <View style={styles.actions}>
            <SecondaryButton label="Disconnect" icon="log-out-outline" danger onPress={() => void handleDisconnect()} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.body}>
            Create a free project at supabase.com, run the schema in{" "}
            <Text style={styles.inlineCode}>supabase/schema.sql</Text>, then enable anonymous
            sign-ins under Authentication → Providers.
          </Text>

          <Field
            label="PROJECT URL"
            value={urlText}
            onChangeText={(value) => {
              setUrlText(value);
              setFormError(null);
            }}
            placeholder="https://abcd1234.supabase.co"
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ANON PUBLIC KEY</Text>
            <View style={styles.keyRow}>
              <TextInput
                value={keyText}
                onChangeText={(value) => {
                  setKeyText(value);
                  setFormError(null);
                }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6…"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showKey}
                style={[styles.input, styles.keyInput]}
                accessibilityLabel="Supabase anon public key"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showKey ? "Hide anon key" : "Show anon key"}
                onPress={() => setShowKey((value) => !value)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showKey ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {formError ? (
            <View style={styles.formError}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={busy ? "Connecting…" : "Connect Supabase"}
            icon="link"
            loading={busy}
            onPress={() => void handleConnect()}
          />
        </Card>
      )}

      <SectionTitle>Local data</SectionTitle>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.body}>Sets on this device</Text>
          <Text style={styles.mono}>{sets.length}</Text>
        </View>
        <View style={styles.rule} />
        {confirmClear ? (
          <View style={styles.confirmRow}>
            <Text style={styles.warnText}>
              Delete all local sets? Remote rows in Supabase are not removed.
            </Text>
            <View style={styles.actionsRow}>
              <SecondaryButton label="Cancel" onPress={() => setConfirmClear(false)} />
              <SecondaryButton
                label="Delete"
                icon="trash-outline"
                danger
                onPress={() => void handleClear()}
              />
            </View>
          </View>
        ) : (
          <SecondaryButton
            label="Clear local sets"
            icon="trash-outline"
            danger
            onPress={() => setConfirmClear(true)}
          />
        )}
      </Card>

      <SectionTitle>Setup checklist</SectionTitle>
      <Card>
        <ChecklistItem text="Run supabase/schema.sql in the SQL editor to create the sets table and RLS policies." />
        <ChecklistItem text="Enable anonymous sign-ins in Authentication → Providers so the app can get a user id without a login screen." />
        <ChecklistItem text="Paste the project URL and anon public key above. The anon key is safe to ship; RLS protects the data." />
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card>
        <Text style={styles.body}>
          SetLog is a demo built with Expo SDK 58, React Native, Expo Router, TypeScript, and
          Supabase. Sets persist through AsyncStorage and merge with Postgres when a connection is
          configured. Anonymous auth plus row-level security keep each user's rows scoped to{" "}
          <Text style={styles.inlineCode}>auth.uid()</Text>.
        </Text>
        <Text style={styles.dim}>Not affiliated with any gym. Demo data only.</Text>
      </Card>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "url";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons name="checkmark-circle-outline" size={16} color={colors.accent} />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  dim: {
    color: colors.textDim,
    fontSize: 11,
  },
  mono: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  rule: {
    height: 1,
    backgroundColor: colors.border,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  valueText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  keyInput: {
    flex: 1,
  },
  eyeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  formError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  formErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  actions: {
    alignItems: "flex-start",
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  confirmRow: {
    gap: spacing.md,
  },
  warnText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  connectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  connectedText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  inlineCode: {
    color: colors.text,
    fontWeight: "700",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
