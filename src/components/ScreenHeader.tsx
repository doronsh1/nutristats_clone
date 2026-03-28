import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  aside?: React.ReactNode;
};

export function ScreenHeader({ eyebrow, title, subtitle, aside }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      {aside ? <View style={styles.aside}>{aside}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  aside: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
});
