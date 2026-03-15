import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from './src/app/AppShell';
import { ensureSeedFoods } from './src/db/foodsRepo';
import { runMigrations } from './src/db/migrations';
import { ensureSettings } from './src/db/settingsRepo';
import { lightColors } from './src/theme/colors';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootstrapStep, setBootstrapStep] = useState('Starting app');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) {
        setBootstrapError(
          `Startup timed out while: ${bootstrapStep}. This usually means the local database did not initialize in the browser.`
        );
      }
    }, 12000);

    async function bootstrap() {
      setBootstrapStep('Opening local database');
      await runMigrations();
      setBootstrapStep('Loading settings');
      await ensureSettings();
      setBootstrapStep('Seeding starter foods');
      await ensureSeedFoods();
      if (active) {
        clearTimeout(timeout);
        setReady(true);
      }
    }

    bootstrap().catch((error) => {
      if (active) {
        clearTimeout(timeout);
        setBootstrapError(error instanceof Error ? error.message : 'Unknown startup error');
      }
    });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    if (bootstrapError) {
      return (
        <View style={styles.loader}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>App startup failed</Text>
            <Text style={styles.errorBody}>{bootstrapError}</Text>
            <Text style={styles.errorHint}>
              Ignore the React DevTools install message. It is unrelated to this failure.
            </Text>
            <Pressable onPress={() => globalThis.location?.reload()} style={styles.retryButton}>
              <Text style={styles.retryLabel}>Reload</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={lightColors.accent} />
        <Text style={styles.loadingLabel}>{bootstrapStep}...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightColors.background,
    padding: 24,
    gap: 14,
  },
  loadingLabel: {
    color: lightColors.text,
    fontSize: 14,
  },
  errorCard: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: lightColors.border,
    backgroundColor: lightColors.surface,
    padding: 20,
    gap: 12,
  },
  errorTitle: {
    color: lightColors.danger,
    fontSize: 22,
    fontWeight: '800',
  },
  errorBody: {
    color: lightColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  errorHint: {
    color: lightColors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: lightColors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
