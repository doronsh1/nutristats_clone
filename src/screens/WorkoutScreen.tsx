import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeatureGate } from '../components/FeatureGate';
import { SectionCard } from '../components/SectionCard';
import { useTheme } from '../theme/ThemeProvider';
import type { UserSettings } from '../types/models';

type WorkoutScreenProps = {
  settings: UserSettings;
};

export function WorkoutScreen({ settings }: WorkoutScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.screen}>
      <SectionCard title="Today's Workout" subtitle="Your personalized training plan">
        <View style={styles.cards}>
          <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recommended Session</Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              Upper body strength • 6 exercises • ~54 minutes
            </Text>
            <View style={styles.cardTags}>
              <View style={[styles.tag, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
                <Text style={[styles.tagLabel, { color: colors.accent }]}>STRENGTH</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.tagLabel, { color: colors.muted }]}>INTERMEDIATE</Text>
              </View>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recovery Status</Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              Chest and triceps ready • Legs recovering (72h)
            </Text>
            <View style={styles.recoveryBar}>
              <View style={[styles.recoveryFill, { width: '75%', backgroundColor: colors.success }]} />
            </View>
          </View>
        </View>
      </SectionCard>

      <FeatureGate
        currentTier={settings.subscriptionTier}
        requiredTier="pro"
        title="AI Workout Coach"
        description="Get adaptive programming with AI-powered progression"
      >
        <SectionCard title="AI Workout Coach" subtitle="Premium feature">
          <Text style={[styles.cardBody, { color: colors.text }]}>
            Unlock intelligent workout planning with automatic progression, fatigue tracking, and personalized volume recommendations based on your performance.
          </Text>
        </SectionCard>
      </FeatureGate>

      <FeatureGate
        currentTier={settings.subscriptionTier}
        requiredTier="pro"
        title="Voice Health Monitor"
        description="Track vocal changes over time with AI analysis"
      >
        <SectionCard title="Voice Health Monitor" subtitle="Premium health tracking">
          <Text style={[styles.cardBody, { color: colors.text }]}>
            Record voice samples and track changes in pitch, tone, and quality over time. Get alerts about significant deviations.
          </Text>
        </SectionCard>
      </FeatureGate>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recoveryBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 8,
  },
  recoveryFill: {
    height: '100%',
    borderRadius: 999,
  },
});
