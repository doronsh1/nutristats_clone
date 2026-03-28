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
  const [bootstrapStep, setBootstrapStep] = useState('Initializing command deck');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) {
        setBootstrapError(`Startup timed out while: ${bootstrapStep}.`);
      }
    }, 12000);

    async function bootstrap() {
      setBootstrapStep('Opening local database');
      await runMigrations();
      setBootstrapStep('Loading athlete profile');
      await ensureSettings();
      setBootstrapStep('Indexing staple foods');
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
            <Text style={styles.errorEyebrow}>SYSTEM ALERT</Text>
            <Text style={styles.errorTitle}>Launch interrupted</Text>
            <Text style={styles.errorBody}>{bootstrapError}</Text>
            <Pressable onPress={() => globalThis.location?.reload()} style={styles.retryButton}>
              <Text style={styles.retryLabel}>Reload command deck</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.loader}>
        <View style={styles.loaderCard}>
          <Text style={styles.loaderEyebrow}>NUTRISTATS / KINETIC LAB</Text>
          <Text style={styles.loaderTitle}>Preparing your performance workspace</Text>
          <Text style={styles.loaderBody}>{bootstrapStep}</Text>
          <ActivityIndicator size="large" color={lightColors.accentSecondary} />
        </View>
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
  },
  loaderCard: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: lightColors.border,
    backgroundColor: lightColors.surface,
    padding: 24,
    gap: 14,
  },
  loaderEyebrow: {
    color: lightColors.accentSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  loaderTitle: {
    color: lightColors.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },
  loaderBody: {
    color: lightColors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  errorCard: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: lightColors.danger,
    backgroundColor: lightColors.surface,
    padding: 24,
    gap: 12,
  },
  errorEyebrow: {
    color: lightColors.danger,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  errorTitle: {
    color: lightColors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  errorBody: {
    color: lightColors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: lightColors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryLabel: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
});
