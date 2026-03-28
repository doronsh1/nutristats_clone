import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

type EmptyStateCardProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyStateCard({ title, body, actionLabel, onAction }: EmptyStateCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onAction}>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
});
