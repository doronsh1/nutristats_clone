import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { getReportSummary } from '../db/diaryRepo';
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
      <SectionCard title="Reports" subtitle="Loading historical summary...">
        <Text style={{ color: colors.muted }}>Calculating recent totals and streaks.</Text>
      </SectionCard>
    );
  }

  const maxCalories = Math.max(...summary.recentDays.map((day) => day.calories), 1);

  return (
    <View style={styles.screen}>
      <SectionCard title="Reports" subtitle="Recent intake, averages, and logging consistency.">
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
                <Text style={[styles.rangeLabel, { color: active ? colors.surface : colors.text }]}>
                  Last {days} Days
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="Logged Days" value={String(summary.loggedDays)} helper={`${summary.rangeDays}-day window`} />
          <MetricCard label="Logging Streak" value={`${summary.loggingStreak}`} helper="consecutive active days" />
          <MetricCard label="Avg Calories" value={`${summary.averageCalories}`} helper="per logged day" />
          <MetricCard label="Avg Protein" value={`${summary.averageProtein} g`} helper="per logged day" />
          <MetricCard label="Avg Carbs" value={`${summary.averageCarbs} g`} helper="per logged day" />
          <MetricCard label="Avg Fat" value={`${summary.averageFat} g`} helper="per logged day" />
        </View>
      </SectionCard>

      <SectionCard title="Recent Days" subtitle="Calories bar and macro totals by day.">
        <View style={styles.dayList}>
          {summary.recentDays.map((day) => (
            <View
              key={day.date}
              style={[styles.dayRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <View style={styles.dayMeta}>
                <Text style={[styles.dayDate, { color: colors.text }]}>{day.date}</Text>
                <Text style={[styles.daySubtle, { color: colors.muted }]}>
                  {day.protein}p / {day.carbs}c / {day.fat}f
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(8, (day.calories / maxCalories) * 100)}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
              <View style={styles.dayScore}>
                <Text style={[styles.dayCalories, { color: colors.text }]}>{Math.round(day.calories)} kcal</Text>
                <Text style={[styles.daySubtle, { color: colors.muted }]}>goal {Math.round(day.goalCalories)}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );

  function MetricCard({
    label,
    value,
    helper,
  }: {
    label: string;
    value: string;
    helper: string;
  }) {
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
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    minWidth: 160,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  metricHelper: {
    fontSize: 12,
  },
  dayList: {
    gap: 10,
  },
  dayRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  dayMeta: {
    gap: 2,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  daySubtle: {
    fontSize: 12,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  dayScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dayCalories: {
    fontSize: 13,
    fontWeight: '700',
  },
});
