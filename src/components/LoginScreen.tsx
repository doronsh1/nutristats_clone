import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createAccount, isAuthConfigured, login, requestPasswordReset } from '../db/authRepo';
import { getMissingFirebaseKeys } from '../services/firebase';
import { useTheme } from '../theme/ThemeProvider';

type AuthMode = 'signin' | 'signup' | 'reset';

export function LoginScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const configured = isAuthConfigured();
  const missingKeys = useMemo(() => getMissingFirebaseKeys(), []);

  async function handleSubmit() {
    if (!configured) {
      setError('Firebase auth is not configured yet.');
      return;
    }

    const trimmedEmail = email.trim();
    setError('');
    setMessage('');

    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }

    if (mode !== 'reset' && !password) {
      setError('Enter your password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const result = await login(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage('Signed in.');
        return;
      }

      if (mode === 'signup') {
        const result = await createAccount(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage('Account created. You are now signed in.');
        return;
      }

      const result = await requestPasswordReset(trimmedEmail);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage('Password reset email sent.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <View style={styles.backdropShape} />
      <View style={styles.backdropShapeSecondary} />

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>ATHLETE LOGIN / NUTRISTATS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Enter the performance lab.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Sync your meal plan, saved templates, and premium training intelligence from one athlete profile.
          </Text>
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="Saved meals" value="48" tone={colors.accent} />
          <MetricCard label="Planner state" value="Live" tone={colors.accentSecondary} />
          <MetricCard label="Tier" value="Pro" tone={colors.premium} />
        </View>

        <View style={[styles.modeRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {([
            ['signin', 'Sign in'],
            ['signup', 'Create'],
            ['reset', 'Recover'],
          ] as [AuthMode, string][]).map(([value, label]) => {
            const active = value === mode;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setMode(value);
                  setError('');
                  setMessage('');
                }}
                style={[
                  styles.modeButton,
                  active ? { backgroundColor: colors.accent } : null,
                ]}
              >
                <Text style={[styles.modeLabel, { color: active ? '#000000' : colors.muted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!configured ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceMuted, borderColor: colors.warning }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Firebase setup required</Text>
            <Text style={[styles.noticeBody, { color: colors.muted }]}>
              Add the missing `EXPO_PUBLIC_FIREBASE_*` values locally and in Cloudflare before auth will work.
            </Text>
            <Text style={[styles.noticeList, { color: colors.warning }]}>{missingKeys.join('\n')}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            colors={colors}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {mode !== 'reset' ? (
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              colors={colors}
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          ) : null}
          {mode === 'signup' ? (
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              colors={colors}
              secureTextEntry
              autoComplete="new-password"
            />
          ) : null}

          {error ? <Text style={[styles.feedback, { color: colors.danger }]}>{error}</Text> : null}
          {message ? <Text style={[styles.feedback, { color: colors.success }]}>{message}</Text> : null}

          <Pressable
            style={[styles.submit, { backgroundColor: configured ? colors.accent : colors.border, opacity: submitting ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting || !configured}
          >
            <Text style={styles.submitLabel}>
              {submitting
                ? mode === 'reset'
                  ? 'Sending reset...'
                  : mode === 'signup'
                    ? 'Creating account...'
                    : 'Signing in...'
                : mode === 'reset'
                  ? 'Send reset email'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Access workspace'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={[styles.metricCard, { borderColor: tone }]}>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  keyboardType,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        placeholder={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  backdropShape: {
    position: 'absolute',
    top: 80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 143, 111, 0.12)',
  },
  backdropShapeSecondary: {
    position: 'absolute',
    bottom: 40,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 30,
    transform: [{ rotate: '-18deg' }],
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 18,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#111111',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#ADAAAA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    gap: 6,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    minHeight: 42,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  notice: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  noticeList: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    borderRadius: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
