import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout, subscribeToSession } from '../db/authRepo';
import { getSettings } from '../db/settingsRepo';
import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen, UserSettings } from '../types/models';
import { BottomTabBar } from '../components/BottomTabBar';
import { LoginScreen } from '../components/LoginScreen';
import { DocsScreen } from '../screens/DocsScreen';
import { FoodsScreen } from '../screens/FoodsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { TierBadge } from '../components/TierBadge';

export function AppShell() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [screen, setScreen] = useState<AppScreen>('Home');
  const [foodsVersion, setFoodsVersion] = useState(0);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let settingsReady = false;
    let sessionReady = false;
    let unsubscribe = () => {};

    function finishLoading() {
      if (active && settingsReady && sessionReady) {
        setLoading(false);
      }
    }

    getSettings()
      .then((currentSettings) => {
        if (!active) {
          return;
        }
        setSettings(currentSettings);
        settingsReady = true;
        finishLoading();
      })
      .catch(() => {
        if (!active) {
          return;
        }
        settingsReady = true;
        setLoading(false);
      });

    subscribeToSession((email) => {
      if (!active) {
        return;
      }
      setSessionEmail(email);
      sessionReady = true;
      finishLoading();
    })
      .then((nextUnsubscribe) => {
        unsubscribe = nextUnsubscribe;
      })
      .catch(() => {
        if (!active) {
          return;
        }
        sessionReady = true;
        setSessionEmail(null);
        finishLoading();
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await logout();
    setSessionEmail(null);
  }

  if (loading || !settings) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!sessionEmail) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View style={[styles.drawerPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogoArea}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>Atlas</Text>
                <Text style={[styles.drawerTagline, { color: colors.muted }]}>Fitness OS</Text>
              </View>
              <TierBadge tier={settings.subscriptionTier} />
            </View>
            <View style={[styles.userChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.drawerSubtitle, { color: colors.text }]}>{sessionEmail}</Text>
            </View>

            <View style={styles.drawerGroup}>
              {(['Home', 'Nutrition', 'Workout', 'Reports', 'Foods', 'Settings', 'Docs'] as AppScreen[]).map((item) => {
                const active = item === screen;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setScreen(item);
                      setDrawerOpen(false);
                    }}
                    style={[
                      styles.drawerItem,
                      {
                        backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.drawerItemLabel, { color: active ? colors.accent : colors.text }]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.drawerFooter}>
              <Pressable
                style={[styles.drawerItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                onPress={() => {
                  setDrawerOpen(false);
                  void handleLogout();
                }}
              >
                <Text style={[styles.drawerItemLabel, { color: colors.text }]}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.appFrame}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.topBarRow}>
            <View style={styles.brand}>
              <Text style={[styles.brandEyebrow, { color: colors.accent }]}>ATLAS</Text>
            </View>
            <TierBadge tier={settings.subscriptionTier} />
          </View>
        </View>

        {screen === 'Home' ? (
          <HomeScreen
            settings={settings}
            reportsVersion={reportsVersion}
            onNavigate={setScreen}
          />
        ) : null}
        {screen === 'Nutrition' ? (
          <NutritionScreen
            settings={settings}
            foodsVersion={foodsVersion}
            onDiarySaved={() => setReportsVersion((value) => value + 1)}
            onOpenFoods={() => setScreen('Foods')}
          />
        ) : null}
        {screen === 'Workout' ? <WorkoutScreen settings={settings} /> : null}
        {screen === 'Foods' ? (
          <FoodsScreen onFoodsChanged={() => setFoodsVersion((value) => value + 1)} />
        ) : null}
        {screen === 'Reports' ? <ReportsScreen refreshKey={reportsVersion} /> : null}
        {screen === 'Settings' ? (
          <SettingsScreen
            settings={settings}
            onSettingsChanged={(next) => {
              setSettings(next);
              setReportsVersion((value) => value + 1);
            }}
          />
        ) : null}
        {screen === 'Docs' ? <DocsScreen /> : null}
        </ScrollView>

        <BottomTabBar
          screen={screen}
          onChange={setScreen}
          onMore={() => setDrawerOpen(true)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  appFrame: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flex: 1,
  },
  brandEyebrow: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 8, 0.42)',
  },
  drawerPanel: {
    width: 300,
    borderLeftWidth: 1,
    padding: 18,
    gap: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drawerLogoArea: {
    gap: 2,
  },
  drawerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  drawerTagline: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userChip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  drawerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  drawerGroup: {
    gap: 10,
  },
  drawerItem: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  drawerFooter: {
    marginTop: 'auto',
    gap: 10,
  },
});
