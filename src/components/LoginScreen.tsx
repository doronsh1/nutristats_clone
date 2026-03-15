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
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>Atlas Account</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sign in to sync your nutrition workspace.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Use Firebase Auth for email sign-in now, then connect backend food data and subscriptions after that.
          </Text>
        </View>

        <View style={[styles.modeRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {([
            ['signin', 'Sign in'],
            ['signup', 'Create account'],
            ['reset', 'Reset password'],
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
                  {
                    backgroundColor: active ? colors.surface : 'transparent',
                    borderColor: active ? colors.border : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.modeLabel, { color: active ? colors.text : colors.muted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!configured ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceMuted, borderColor: colors.warning }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Firebase setup required</Text>
            <Text style={[styles.noticeBody, { color: colors.muted }]}>
              Add the missing `EXPO_PUBLIC_FIREBASE_*` values locally and in Cloudflare before login will work.
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
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          {message ? <Text style={[styles.message, { color: colors.success }]}>{message}</Text> : null}
          <Pressable
            style={[
              styles.submit,
              {
                backgroundColor: configured ? colors.accent : colors.border,
                opacity: submitting ? 0.8 : 1,
              },
            ]}
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
                    : 'Sign in'}
            </Text>
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
    borderWidth: 1,
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
  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    gap: 6,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '800',
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
  message: {
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
