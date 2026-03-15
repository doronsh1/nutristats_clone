import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEMO_EMAIL, DEMO_PASSWORD } from '../constants/auth';
import { login } from '../db/authRepo';
import { useTheme } from '../theme/ThemeProvider';

type LoginScreenProps = {
  onLoggedIn: (email: string) => void;
};

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const sessionEmail = await login(email, password);
    setSubmitting(false);

    if (!sessionEmail) {
      setError('Use the demo credentials from the PRD.');
      return;
    }

    onLoggedIn(sessionEmail);
  }

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>Nutrition Diary MVP</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Track meals like a serious spreadsheet user.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Built from the NutriStats-style workflow: fast meal entry, live macros, reports, settings, and local persistence.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            colors={colors}
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            colors={colors}
            secureTextEntry
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <Pressable
            style={[styles.submit, { backgroundColor: colors.accent }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitLabel}>{submitting ? 'Signing in...' : 'Enter Diary'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 540,
    borderWidth: 1,
    borderRadius: 32,
    padding: 24,
    gap: 24,
  },
  hero: {
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
  },
  submit: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
