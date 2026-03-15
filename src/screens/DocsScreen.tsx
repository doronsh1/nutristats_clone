import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { useTheme } from '../theme/ThemeProvider';

export function DocsScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.screen}>
      <SectionCard title="Documentation" subtitle="Architecture summary and implementation boundaries.">
        <Text style={[styles.paragraph, { color: colors.text }]}>
          This MVP is intentionally local-first. The app stores diary days, meals, foods, settings, session state, and the meal clipboard in SQLite so the core workflow remains fast and offline-friendly.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The codebase is split into repositories for persistence, pure domain utilities for calculations and diary transforms, and feature screens for diary, foods, reports, and settings. That makes it straightforward to swap repository calls for HTTP endpoints later.
        </Text>
      </SectionCard>

      <SectionCard title="Shipped Scope" subtitle="What is in this version.">
        <Text style={[styles.listItem, { color: colors.text }]}>Diary page with day navigation, meal copy/paste/clear, and live totals</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Foods database CRUD with starter seed items</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Reports for 7-day and 30-day history</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Settings for default targets, meal count, and theme</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Local auth stub using the demo account</Text>
      </SectionCard>

      <SectionCard title="Roadmap" subtitle="Deferred from the extended PRD.">
        <Text style={[styles.listItem, { color: colors.text }]}>Barcode and QR food scanning</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Voice meal logging and AI parsing</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Workout planner and recovery-aware programming</Text>
        <Text style={[styles.listItem, { color: colors.text }]}>Voice monitoring and steroid-use analyzer concepts</Text>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 21,
  },
});
