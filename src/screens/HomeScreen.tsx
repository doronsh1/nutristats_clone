import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getDiaryDay, getReportSummary } from '../db/diaryRepo';
import { calculateDaySummary } from '../domain/calculations';
import { formatFullDateLabel, getTodayKey } from '../domain/dates';
import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen, DaySummary, UserSettings } from '../types/models';

type HomeScreenProps = {
  settings: UserSettings;
  reportsVersion: number;
  onNavigate: (screen: AppScreen) => void;
};

export function HomeScreen({ settings, reportsVersion, onNavigate }: HomeScreenProps) {
  const { colors } = useTheme();
  const [todaySummary, setTodaySummary] = useState<DaySummary | null>(null);
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const today = await getDiaryDay(getTodayKey(), settings);
      const reports = await getReportSummary(7);
      if (!active) {
        return;
      }
      setTodaySummary(calculateDaySummary(today));
      setWeeklyAverage(reports.averageCalories);
    }

    load().catch(() => {
      if (active) {
        setTodaySummary(null);
        setWeeklyAverage(null);
      }
    });

    return () => {
      active = false;
    };
  }, [reportsVersion, settings]);

  const calories = Math.round(todaySummary?.totals.calories ?? 0);
  const calorieGoal = Math.round(todaySummary?.goalCalories ?? settings.defaultCalorieGoal);
  const protein = Math.round(todaySummary?.protein.grams ?? 0);
  const proteinTarget = settings.defaultProteinTarget;
  const carbs = Math.round(todaySummary?.carbs.grams ?? 0);
  const fat = Math.round(todaySummary?.fat.grams ?? 0);
  const remaining = Math.max(0, calorieGoal - calories);
  const proteinGap = Math.max(0, proteinTarget - protein);
  const adherence = Math.min(100, Math.round((calories / Math.max(1, calorieGoal)) * 100));

  const recommendation = useMemo(() => {
    if (calories === 0) {
      return 'Start with the first meal so the rest of the day can auto-balance around real intake.';
    }
    if (proteinGap > 30) {
      return `Protein is still the main miss. Close the remaining ${proteinGap}g before the final meal.`;
    }
    if (remaining > 450) {
      return `You still have ${remaining} kcal to place. Use saved templates instead of improvising late.`;
    }
    return 'Execution is clean. Keep the final meal simple and protect tomorrow’s setup.';
  }, [calories, proteinGap, remaining]);

  return (
    <View style={styles.screen}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>DAILY PERFORMANCE DIARY</Text>
            <Text style={[styles.title, { color: colors.text }]}>Today needs fewer taps and sharper numbers.</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{formatFullDateLabel(getTodayKey())}</Text>
          </View>
          <View style={[styles.scoreCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.scoreValue, { color: colors.accent }]}>{adherence}%</Text>
            <Text style={[styles.scoreLabel, { color: colors.muted }]}>plan tracked</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatBlock label="Calories" value={`${calories}`} helper={`goal ${calorieGoal}`} tone={colors.accent} />
          <StatBlock label="Protein" value={`${protein}g`} helper={`target ${proteinTarget}g`} tone={colors.accentSecondary} />
          <StatBlock label="Carbs" value={`${carbs}g`} helper="active fuel" tone={colors.premium} />
          <StatBlock label="Fat" value={`${fat}g`} helper="stability" tone={colors.muted} />
        </View>

        <View style={[styles.recommendation, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Text style={[styles.recommendationLabel, { color: colors.muted }]}>System recommendation</Text>
          <Text style={[styles.recommendationBody, { color: colors.text }]}>{recommendation}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.primaryPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.panelEyebrow, { color: colors.accent }]}>NEXT MOVES</Text>
          <Pressable style={[styles.actionRow, { borderColor: colors.border }]} onPress={() => onNavigate('Nutrition')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Open fuel planner</Text>
            <Text style={[styles.actionBody, { color: colors.muted }]}>Saved meals, food search, and today’s macro targets.</Text>
          </Pressable>
          <Pressable style={[styles.actionRow, { borderColor: colors.border }]} onPress={() => onNavigate('Workout')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Check workout dashboard</Text>
            <Text style={[styles.actionBody, { color: colors.muted }]}>Move from meal timing into readiness and session focus.</Text>
          </Pressable>
          <Pressable style={[styles.actionRow, { borderColor: colors.border }]} onPress={() => onNavigate('Foods')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Search fuel database</Text>
            <Text style={[styles.actionBody, { color: colors.muted }]}>Tune the catalog before you create one-off diary entries.</Text>
          </Pressable>
        </View>

        <View style={[styles.secondaryPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.panelEyebrow, { color: colors.accentSecondary }]}>7-DAY SIGNAL</Text>
          <Text style={[styles.secondaryValue, { color: colors.text }]}>{Math.round(weeklyAverage ?? 0)}</Text>
          <Text style={[styles.secondaryMeta, { color: colors.muted }]}>average calories per logged day</Text>

          <View style={styles.badgeStack}>
            <InlineBadge label={`${remaining} kcal left`} tone={colors.accent} />
            <InlineBadge label={`${proteinGap}g protein left`} tone={colors.accentSecondary} />
            <InlineBadge label={`${settings.subscriptionTier.toUpperCase()} tier`} tone={colors.premium} />
          </View>
        </View>
      </View>
    </View>
  );

  function StatBlock({
    label,
    value,
    helper,
    tone,
  }: {
    label: string;
    value: string;
    helper: string;
    tone: string;
  }) {
    return (
      <View style={[styles.statBlock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
        <Text style={[styles.statHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }

  function InlineBadge({ label, tone }: { label: string; tone: string }) {
    return (
      <View style={[styles.inlineBadge, { borderColor: tone }]}>
        <Text style={[styles.inlineBadgeLabel, { color: tone }]}>{label}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroCopy: {
    flex: 1,
    gap: 6,
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreCard: {
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBlock: {
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statHelper: {
    fontSize: 12,
  },
  recommendation: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recommendationBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  primaryPanel: {
    flex: 1.2,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  secondaryPanel: {
    flex: 0.8,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionRow: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  secondaryValue: {
    fontSize: 56,
    lineHeight: 58,
    fontWeight: '900',
  },
  secondaryMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeStack: {
    gap: 8,
    marginTop: 4,
  },
  inlineBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineBadgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
