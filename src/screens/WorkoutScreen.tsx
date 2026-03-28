import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FeatureGate } from '../components/FeatureGate';
import { useTheme } from '../theme/ThemeProvider';
import type { UserSettings } from '../types/models';

type WorkoutScreenProps = {
  settings: UserSettings;
};

export function WorkoutScreen({ settings }: WorkoutScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>WORKOUT DASHBOARD</Text>
        <Text style={[styles.title, { color: colors.text }]}>Training, recovery, and AI planning share one dashboard now.</Text>

        <View style={styles.metricRow}>
          <MetricCard label="Readiness" value="84%" helper="central nervous system" tone={colors.premium} />
          <MetricCard label="Session" value="Push" helper="upper emphasis" tone={colors.accent} />
          <MetricCard label="Duration" value="54m" helper="planned output" tone={colors.accentSecondary} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.mainPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>TODAY'S SESSION</Text>
          <WorkoutRow title="Bench cluster" body="5 sets / top triple / back-off volume" />
          <WorkoutRow title="Incline dumbbell press" body="3 sets / controlled tempo / 90 sec rest" />
          <WorkoutRow title="Cable fly finishers" body="2 sets / failure-minus-one / short rest" />

          <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.fill, { width: '72%', backgroundColor: colors.accentSecondary }]} />
          </View>
          <Text style={[styles.helper, { color: colors.muted }]}>72% of weekly push volume already accounted for.</Text>
        </View>

        <View style={[styles.sidePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.premium }]}>RECOVERY</Text>
          <RecoveryLine label="Chest / shoulders" value="Ready" tone={colors.premium} />
          <RecoveryLine label="Triceps" value="Monitor" tone={colors.warning} />
          <RecoveryLine label="Legs" value="48h" tone={colors.muted} />
        </View>
      </View>

      <FeatureGate
        currentTier={settings.subscriptionTier}
        requiredTier="pro"
        title="AI Performance Planner"
        description="Unlock the Stitch-style premium planning flow for adaptive session setup."
      >
        <View style={[styles.premiumPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.accentSecondary }]}>AI PERFORMANCE PLANNER</Text>
          <Text style={[styles.premiumTitle, { color: colors.text }]}>Setup flow</Text>
          <Text style={[styles.premiumBody, { color: colors.muted }]}>
            The planner is positioned like a guided console: training phase, recovery state, volume target, and meal timing are treated as one plan instead of isolated widgets.
          </Text>

          <View style={styles.stepRow}>
            <PlannerStep index="01" title="Goal phase" body="Strength block / week 4 / intensification" />
            <PlannerStep index="02" title="Fatigue check" body="Sleep, soreness, and session density" />
            <PlannerStep index="03" title="Fuel sync" body="Pre and post-workout nutrition timing" />
          </View>

          <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
            <Text style={styles.primaryButtonLabel}>Build performance plan</Text>
          </Pressable>
        </View>
      </FeatureGate>
    </View>
  );

  function MetricCard({
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
      <View style={[styles.metricCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
        <Text style={[styles.metricHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }

  function WorkoutRow({ title, body }: { title: string; body: string }) {
    return (
      <View style={[styles.workoutRow, { borderColor: colors.border }]}>
        <Text style={[styles.workoutTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.workoutBody, { color: colors.muted }]}>{body}</Text>
      </View>
    );
  }

  function RecoveryLine({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
      <View style={[styles.recoveryLine, { borderColor: colors.border }]}>
        <Text style={[styles.recoveryLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.recoveryValue, { color: tone }]}>{value}</Text>
      </View>
    );
  }

  function PlannerStep({ index, title, body }: { index: string; title: string; body: string }) {
    return (
      <View style={[styles.plannerStep, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.plannerIndex, { color: colors.accentSecondary }]}>{index}</Text>
        <Text style={[styles.plannerTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.plannerBody, { color: colors.muted }]}>{body}</Text>
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
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  metricHelper: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  mainPanel: {
    flex: 1.1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  sidePanel: {
    flex: 0.9,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  workoutRow: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    gap: 4,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  workoutBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  helper: {
    fontSize: 12,
  },
  recoveryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  recoveryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  recoveryValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  premiumPanel: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  premiumTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  premiumBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  stepRow: {
    gap: 10,
  },
  plannerStep: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  plannerIndex: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  plannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  plannerBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
