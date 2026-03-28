import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
    setStatus('Profile updated.');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>PROFILE / PREMIUM AREA</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your nutrition identity, visual mode, and upgrade path live here.</Text>

        <View style={styles.tierRow}>
          {(['free', 'pro', 'elite'] as SubscriptionTier[]).map((tier) => {
            const active = draft.subscriptionTier === tier;
            return (
              <Pressable
                key={tier}
                onPress={() => setDraft((current) => ({ ...current, subscriptionTier: tier }))}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: active ? colors.surfaceMuted : colors.background,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tierLabel, { color: active ? colors.accent : colors.text }]}>{tier.toUpperCase()}</Text>
                <Text style={[styles.tierBody, { color: colors.muted }]}>
                  {tier === 'free' ? 'Core diary' : tier === 'pro' ? 'AI planner and analytics' : 'Full lab mode'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.panelEyebrow, { color: colors.accent }]}>DEFAULT TARGETS</Text>
          <View style={styles.grid}>
            <NumericField label="Calories" value={draft.defaultCalorieGoal} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultCalorieGoal: value }))} />
            <NumericField label="Protein" value={draft.defaultProteinTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultProteinTarget: value }))} />
            <NumericField label="Carbs" value={draft.defaultCarbTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultCarbTarget: value }))} />
            <NumericField label="Fat" value={draft.defaultFatTarget} onChangeValue={(value) => setDraft((current) => ({ ...current, defaultFatTarget: value }))} />
            <NumericField label="Meals" value={draft.preferredMealCount} onChangeValue={(value) => setDraft((current) => ({ ...current, preferredMealCount: value }))} />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.panelEyebrow, { color: colors.accentSecondary }]}>VISUAL MODE</Text>
          <View style={styles.optionRow}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => {
              const active = draft.theme === theme;
              return (
                <Pressable
                  key={theme}
                  onPress={() => setDraft((current) => ({ ...current, theme }))}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: active ? colors.accentSecondary : colors.surfaceMuted,
                      borderColor: active ? colors.accentSecondary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionLabel, { color: active ? '#001217' : colors.text }]}>{theme}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.noteCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>Premium positioning</Text>
            <Text style={[styles.noteBody, { color: colors.muted }]}>
              This screen now mirrors the Stitch premium area: subscription state is visible, deliberate, and still editable from the local-first settings model.
            </Text>
          </View>

          <Pressable style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={() => void handleSave()}>
            <Text style={styles.saveButtonLabel}>Save profile</Text>
          </Pressable>
          {status ? <Text style={[styles.status, { color: colors.muted }]}>{status}</Text> : null}
        </View>
      </View>
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
          style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tierCard: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  tierBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  panel: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 14,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    minWidth: 130,
    flexGrow: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveButtonLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  status: {
    fontSize: 12,
  },
});
