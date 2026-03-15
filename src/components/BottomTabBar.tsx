import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen } from '../types/models';

type BottomTabBarProps = {
  screen: AppScreen;
  onChange: (screen: AppScreen) => void;
  onMore: () => void;
};

const tabs: Array<{ key: AppScreen | 'More'; label: string }> = [
  { key: 'Home', label: 'Home' },
  { key: 'Nutrition', label: 'Fuel' },
  { key: 'Workout', label: 'Train' },
  { key: 'Reports', label: 'Progress' },
  { key: 'More', label: 'More' },
];

export function BottomTabBar({ screen, onChange, onMore }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {tabs.map((tab) => {
        const active = tab.key !== 'More' && tab.key === screen;
        return (
          <Pressable
            key={tab.key}
            onPress={() => (tab.key === 'More' ? onMore() : onChange(tab.key))}
            style={[
              styles.item,
              {
                backgroundColor: active ? colors.accentSoft : 'transparent',
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: active ? colors.accent : colors.surfaceMuted }]} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
});
