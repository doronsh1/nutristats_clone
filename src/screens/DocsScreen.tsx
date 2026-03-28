import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export function DocsScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>PRODUCT REQUIREMENTS DOCUMENT</Text>
        <Text style={[styles.title, { color: colors.text }]}>NutriStats is being framed as goal-based nutrition execution for serious athletes.</Text>
        <Text style={[styles.body, { color: colors.muted }]}>
          The Stitch PRD pushes the app away from generic tracking and toward disciplined plan adherence, dense metrics, and fast repeat behavior.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardEyebrow, { color: colors.accent }]}>MVP SCOPE</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Nutrition diary with repeatable meals and macro tracking.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Saved meals and templates for fast athlete workflows.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Workout dashboard and premium AI planner surface.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Profile and premium area tied to subscription state.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardEyebrow, { color: colors.accentSecondary }]}>DESIGN PRINCIPLES</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Efficiency first with fewer steps to repeat standard meals.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Data density without pastel wellness-app styling.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Dark, high-contrast surfaces with orange/blue athletic accents.</Text>
          <Text style={[styles.cardItem, { color: colors.text }]}>Mobile-first layouts that still feel like calibrated instruments.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 10,
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
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 10,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardItem: {
    fontSize: 14,
    lineHeight: 21,
  },
});
