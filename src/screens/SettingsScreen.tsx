import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { updateSettings } from '../db/settingsRepo';
import { useTheme } from '../theme/ThemeProvider';
import type { SubscriptionTier, ThemePreference, UserSettings } from '../types/models';

type SettingsScreenProps = {
  settings: UserSettings;
  onSettingsChanged: (settings: UserSettings) => void;
};

export function SettingsScreen({ settings, onSettingsChanged }: SettingsScreenProps) {
  const { colors, setPreference } = useTheme();
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  async function handleSave() {
    const normalized: UserSettings = {
      defaultCalorieGoal: Math.max(0, Number(draft.defaultCalorieGoal) || 0),
      defaultProteinTarget: Math.max(0, Number(draft.defaultProteinTarget) || 0),
      defaultFatTarget: Math.max(0, Number(draft.defaultFatTarget) || 0),
      defaultCarbTarget: Math.max(0, Number(draft.defaultCarbTarget) || 0),
      preferredMealCount: Math.min(8, Math.max(4, Number(draft.preferredMealCount) || 6)),
      theme: draft.theme,
      subscriptionTier: draft.subscriptionTier,
      units: 'grams',
    };

    await updateSettings(normalized);
    await setPreference(normalized.theme);
    onSettingsChanged(normalized);
    setStatus('Settings saved locally.');
  }

  return (
    <View style={styles.screen}>
      <SectionCard title="Settings" subtitle="Default targets, meal layout, and app appearance.">
        <View style={styles.grid}>
          <NumericField label="Default Calories" value={draft.defaultCalorieGoal} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultCalorieGoal: value }))} />
          <NumericField label="Default Protein" value={draft.defaultProteinTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultProteinTarget: value }))} />
          <NumericField label="Default Carbs" value={draft.defaultCarbTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultCarbTarget: value }))} />
          <NumericField label="Default Fat" value={draft.defaultFatTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultFatTarget: value }))} />
          <NumericField label="Meal Count" value={draft.preferredMealCount} onChangeValue={(value) => setDraft((current) => ({ ...current, preferredMealCount: value }))} />
        </View>

        <View style={styles.themeRow}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => {
            const active = draft.theme === theme;
            return (
              <Pressable
                key={theme}
                onPress={() => setDraft((current) => ({ ...current, theme }))}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceMuted,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.themeLabel, { color: active ? colors.surface : colors.text }]}>{theme}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.themeRow}>
          {(['free', 'pro', 'elite'] as SubscriptionTier[]).map((tier) => {
            const active = draft.subscriptionTier === tier;
            return (
              <Pressable
                key={tier}
                onPress={() => setDraft((current) => ({ ...current, subscriptionTier: tier }))}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceMuted,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.themeLabel, { color: active ? colors.surface : colors.text }]}>{tier}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={() => void handleSave()}>
          <Text style={styles.saveButtonLabel}>Save Settings</Text>
        </Pressable>
        {status ? <Text style={[styles.status, { color: colors.muted }]}>{status}</Text> : null}
      </SectionCard>

      <SectionCard title="MVP Notes" subtitle="Current boundaries of the shipped implementation.">
        <Text style={[styles.note, { color: colors.text }]}>
          Data stays local-first. The app now includes subscription-tier state so voice analysis and other premium modules can be gated consistently instead of scattered behind one-off checks.
        </Text>
      </SectionCard>
    </View>
  );

  function NumericField({
    label,
    value,
    onChangeValue,
  }: {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
  }) {
    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChangeValue(Number(text) || 0)}
          keyboardType="numeric"
          style={[
            styles.fieldInput,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
          ]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    minWidth: 150,
    flexGrow: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  saveButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  status: {
    fontSize: 12,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
  },
});
