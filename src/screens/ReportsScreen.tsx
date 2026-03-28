import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyStateCard } from '../components/EmptyStateCard';
import { getReportSummary } from '../db/diaryRepo';
import { formatDateLabel } from '../domain/dates';
import { useTheme } from '../theme/ThemeProvider';
import type { ReportSummary } from '../types/models';

type ReportsScreenProps = {
  refreshKey: number;
};

export function ReportsScreen({ refreshKey }: ReportsScreenProps) {
  const { colors } = useTheme();
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    let active = true;
    getReportSummary(rangeDays).then((result) => {
      if (active) {
        setSummary(result);
      }
    });
    return () => {
      active = false;
    };
  }, [rangeDays, refreshKey]);

  if (!summary) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>Loading performance signals</Text>
        <Text style={[styles.loadingBody, { color: colors.muted }]}>Recent adherence is being calculated.</Text>
      </View>
    );
  }

  const maxCalories = Math.max(...summary.recentDays.map((day) => day.calories), 1);

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>PERFORMANCE SIGNALS</Text>
        <Text style={[styles.title, { color: colors.text }]}>Trends read like a console instead of a spreadsheet.</Text>

        <View style={styles.rangeRow}>
          {[7, 30].map((days) => {
            const active = days === rangeDays;
            return (
              <Pressable
                key={days}
                style={[
                  styles.rangeButton,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceMuted,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setRangeDays(days as 7 | 30)}
              >
                <Text style={[styles.rangeLabel, { color: active ? '#000000' : colors.text }]}>Last {days} days</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="Logged days" value={`${summary.loggedDays}`} helper={`${summary.rangeDays}-day window`} />
          <MetricCard label="Streak" value={`${summary.loggingStreak}`} helper="consecutive entries" />
          <MetricCard label="Avg calories" value={`${summary.averageCalories}`} helper="per logged day" />
          <MetricCard label="Avg protein" value={`${summary.averageProtein}g`} helper="per logged day" />
        </View>
      </View>

      <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.historyEyebrow, { color: colors.accent }]}>RECENT DAYS</Text>
        {summary.recentDays.length > 0 ? (
          summary.recentDays.map((day) => (
            <View key={day.date} style={[styles.dayRow, { borderColor: colors.border }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, { color: colors.text }]}>{formatDateLabel(day.date)}</Text>
                <Text style={[styles.dayMeta, { color: colors.muted }]}>
                  {day.protein}p / {day.carbs}c / {day.fat}f
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(8, (day.calories / maxCalories) * 100)}%`,
                      backgroundColor: colors.accentSecondary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayCalories, { color: colors.text }]}>
                {Math.round(day.calories)} kcal
                <Text style={[styles.dayGoal, { color: colors.muted }]}> / goal {Math.round(day.goalCalories)}</Text>
              </Text>
            </View>
          ))
        ) : (
          <EmptyStateCard title="No history yet" body="Start logging meals and this screen will fill in with recent calorie and macro performance." />
        )}
      </View>
    </View>
  );

  function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.metricHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  loadingBody: {
    fontSize: 14,
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
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rangeLabel: {
    fontSize: 13,
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
  historyCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  historyEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dayRow: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    gap: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '800',
  },
  dayMeta: {
    fontSize: 12,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  dayCalories: {
    fontSize: 13,
    fontWeight: '800',
  },
  dayGoal: {
    fontSize: 13,
    fontWeight: '500',
  },
});
