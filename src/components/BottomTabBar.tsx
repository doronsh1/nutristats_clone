import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen } from '../types/models';

type BottomTabBarProps = {
  screen: AppScreen;
  onChange: (screen: AppScreen) => void;
  onMore: () => void;
};

const tabs: Array<{ key: AppScreen | 'More'; label: string; glyph: string }> = [
  { key: 'Home', label: 'Diary', glyph: '01' },
  { key: 'Nutrition', label: 'Fuel', glyph: '02' },
  { key: 'Workout', label: 'Train', glyph: '03' },
  { key: 'Reports', label: 'Signals', glyph: '04' },
  { key: 'More', label: 'More', glyph: '05' },
];

const moreScreens: AppScreen[] = ['Foods', 'Settings', 'Docs'];

export function BottomTabBar({ screen, onChange, onMore }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {tabs.map((tab) => {
        const active = tab.key === 'More' ? moreScreens.includes(screen) : tab.key === screen;
        return (
          <Pressable
            key={tab.key}
            onPress={() => (tab.key === 'More' ? onMore() : onChange(tab.key))}
            style={[styles.item, active ? { backgroundColor: colors.surfaceMuted } : null]}
          >
            <Text style={[styles.glyph, { color: active ? colors.accent : colors.muted }]}>{tab.glyph}</Text>
            <Text style={[styles.label, { color: active ? colors.text : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 24,
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  item: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glyph: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
});
