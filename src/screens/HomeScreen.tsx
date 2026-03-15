import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeatureGate } from '../components/FeatureGate';
import { SectionCard } from '../components/SectionCard';
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
      }
    });

    return () => {
      active = false;
    };
  }, [reportsVersion, settings]);

  const caloriesConsumed = Math.round(todaySummary?.totals.calories ?? 0);
  const caloriesGoal = Math.round(todaySummary?.goalCalories ?? settings.defaultCalorieGoal);
  const caloriePct = Math.min(100, Math.round((caloriesConsumed / Math.max(1, caloriesGoal)) * 100));

  return (
    <View style={styles.screen}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroEyebrow, { color: colors.accent }]}>OVERVIEW</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Today's Progress</Text>
            <Text style={[styles.heroSubtitle, { color: colors.muted }]}>{formatFullDateLabel(getTodayKey())}</Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: colors.accentSecondary }]}>
            <Text style={styles.planBadgeLabel}>{settings.subscriptionTier.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.heroMetrics}>
          <View style={[styles.metricBlock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Calories</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{caloriesConsumed}</Text>
            <Text style={[styles.metricMeta, { color: colors.muted }]}>of {caloriesGoal}</Text>
          </View>
          <View style={[styles.metricBlock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Protein</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{Math.round(todaySummary?.protein.grams ?? 0)}g</Text>
            <Text style={[styles.metricMeta, { color: colors.muted }]}>target {settings.defaultProteinTarget}g</Text>
          </View>
        </View>

        <View style={styles.progressPanel}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.progressFill, { width: `${caloriePct}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressCaption, { color: colors.muted }]}>
            {caloriePct}% of daily calories • 7-day average: {weeklyAverage ?? 0} kcal
          </Text>
        </View>

        <View style={styles.heroActions}>
          <ActionButton title="Plan Meals" tone="primary" onPress={() => onNavigate('Nutrition')} />
          <ActionButton title="Start Workout" tone="secondary" onPress={() => onNavigate('Workout')} />
          <ActionButton title="Foods & Scans" tone="neutral" onPress={() => onNavigate('Foods')} />
        </View>
      </View>

      <SectionCard title="Quick Actions" subtitle="Your most common tasks">
        <View style={styles.priorityList}>
          <PriorityCard title="Log meals" body="Track your nutrition and hit your macro targets" cta="Open Nutrition" onPress={() => onNavigate('Nutrition')} />
          <PriorityCard title="Start workout" body="Follow your personalized training plan" cta="Go to Workout" onPress={() => onNavigate('Workout')} />
          <PriorityCard title="Manage foods" body="Add and organize your food library" cta="Open Foods" onPress={() => onNavigate('Foods')} />
        </View>
      </SectionCard>

      <SectionCard title="Daily Stats" subtitle="Track your progress at a glance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.snapshotRow}>
            <MiniStat title="Remaining" value={`${Math.max(0, caloriesGoal - caloriesConsumed)} cal`} />
            <MiniStat title="Protein Left" value={`${Math.max(0, settings.defaultProteinTarget - Math.round(todaySummary?.protein.grams ?? 0))}g`} />
            <MiniStat title="Streak" value="3 days" />
            <MiniStat title="Weekly Avg" value={`${weeklyAverage ?? 0} cal`} />
          </View>
        </ScrollView>
      </SectionCard>

      <FeatureGate
        currentTier={settings.subscriptionTier}
        requiredTier="pro"
        title="AI Coaching"
        description="Unlock advanced AI-powered coaching and analytics features"
      >
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.premiumEyebrow, { color: colors.premium }]}>PREMIUM FEATURE</Text>
          <Text style={[styles.premiumTitle, { color: colors.text }]}>AI-Powered Coaching</Text>
          <Text style={[styles.premiumBody, { color: colors.muted }]}>
            Get personalized workout recommendations, recovery tracking, and voice health monitoring with AI insights.
          </Text>
          <Pressable style={[styles.premiumButton, { backgroundColor: colors.accentSecondary }]} onPress={() => onNavigate('Workout')}>
            <Text style={styles.premiumButtonLabel}>Learn More</Text>
          </Pressable>
        </View>
      </FeatureGate>
    </View>
  );

  function ActionButton({
    title,
    onPress,
    tone,
  }: {
    title: string;
    onPress: () => void;
    tone: 'primary' | 'secondary' | 'neutral';
  }) {
    const backgroundColor =
      tone === 'primary' ? colors.accent : tone === 'secondary' ? colors.accentSecondary : colors.surfaceMuted;
    const textColor = tone === 'neutral' ? colors.text : '#FFFFFF';

    return (
      <Pressable style={[styles.actionButton, { backgroundColor }]} onPress={onPress}>
        <Text style={[styles.actionButtonLabel, { color: textColor }]}>{title}</Text>
      </Pressable>
    );
  }

  function PriorityCard({
    title,
    body,
    cta,
    onPress,
  }: {
    title: string;
    body: string;
    cta: string;
    onPress: () => void;
  }) {
    return (
      <Pressable style={[styles.priorityCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]} onPress={onPress}>
        <Text style={[styles.priorityTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.priorityBody, { color: colors.muted }]}>{body}</Text>
        <Text style={[styles.priorityCta, { color: colors.accent }]}>{cta}</Text>
      </Pressable>
    );
  }

  function MiniStat({ title, value }: { title: string; value: string }) {
    return (
      <View style={[styles.miniStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.miniStatTitle, { color: colors.muted }]}>{title}</Text>
        <Text style={[styles.miniStatValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 14,
  },
  planBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planBadgeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricBlock: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '900',
  },
  metricMeta: {
    fontSize: 13,
  },
  progressPanel: {
    gap: 8,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressCaption: {
    fontSize: 13,
  },
  heroActions: {
    gap: 10,
  },
  actionButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  priorityList: {
    gap: 12,
  },
  priorityCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  priorityTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  priorityBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  priorityCta: {
    fontSize: 13,
    fontWeight: '800',
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniStat: {
    width: 138,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 4,
  },
  miniStatTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  premiumCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 20,
    gap: 10,
  },
  premiumEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  premiumBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  premiumButton: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  premiumButtonLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
