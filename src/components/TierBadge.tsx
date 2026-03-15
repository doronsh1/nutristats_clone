import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatTierLabel } from '../domain/subscription';
import { useTheme } from '../theme/ThemeProvider';
import type { SubscriptionTier } from '../types/models';

export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.accent }]}>{formatTierLabel(tier)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
