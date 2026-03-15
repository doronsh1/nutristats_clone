import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { hasTierAccess, formatTierLabel } from '../domain/subscription';
import { useTheme } from '../theme/ThemeProvider';
import type { SubscriptionTier } from '../types/models';

type FeatureGateProps = {
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function FeatureGate({
  currentTier,
  requiredTier,
  title,
  description,
  children,
}: FeatureGateProps) {
  const { colors } = useTheme();

  if (hasTierAccess(currentTier, requiredTier)) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.lockedCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.badgeLabel, { color: colors.accent }]}>{formatTierLabel(requiredTier)}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
});
