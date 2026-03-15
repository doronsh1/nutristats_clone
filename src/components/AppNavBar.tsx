import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen } from '../types/models';

type AppNavBarProps = {
  screen: AppScreen;
  onChange: (screen: AppScreen) => void;
};

const primaryScreens: AppScreen[] = ['Home', 'Nutrition', 'Workout', 'Reports'];
const secondaryScreens: AppScreen[] = ['Foods', 'Settings', 'Docs'];

export function AppNavBar({ screen, onChange }: AppNavBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <NavLane screens={primaryScreens} screen={screen} onChange={onChange} accent />
      <NavLane screens={secondaryScreens} screen={screen} onChange={onChange} />
    </View>
  );

  function NavLane({
    screens,
    screen,
    onChange,
    accent = false,
  }: {
    screens: AppScreen[];
    screen: AppScreen;
    onChange: (screen: AppScreen) => void;
    accent?: boolean;
  }) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.row}>
          {screens.map((item) => {
            const active = item === screen;
            return (
              <Pressable
                key={item}
                onPress={() => onChange(item)}
                style={[
                  styles.button,
                  {
                    backgroundColor: active ? colors.accent : accent ? colors.surfaceMuted : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.label, { color: active ? colors.surface : colors.text }]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  content: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
