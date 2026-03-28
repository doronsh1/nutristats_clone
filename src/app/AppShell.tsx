import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../components/BottomTabBar';
import { LoginScreen } from '../components/LoginScreen';
import { logout, subscribeToSession } from '../db/authRepo';
import { getSettings } from '../db/settingsRepo';
import { DocsScreen } from '../screens/DocsScreen';
import { FoodsScreen } from '../screens/FoodsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { AppScreen, UserSettings } from '../types/models';

const primaryScreens: AppScreen[] = ['Home', 'Nutrition', 'Workout', 'Reports'];
const secondaryScreens: AppScreen[] = ['Foods', 'Settings', 'Docs'];

const screenMeta: Record<AppScreen, { index: string; title: string; subtitle: string }> = {
  Home: {
    index: '01',
    title: 'Daily Performance Diary',
    subtitle: 'Macros, timing, and the next decision in one athlete-facing view.',
  },
  Nutrition: {
    index: '02',
    title: 'Fuel Planner',
    subtitle: 'Search the database, reuse saved meals, and build a cleaner diary flow.',
  },
  Workout: {
    index: '03',
    title: 'Workout Dashboard',
    subtitle: 'Training readiness, premium planning, and execution live in the same lane.',
  },
  Reports: {
    index: '04',
    title: 'Performance Signals',
    subtitle: 'Recent adherence and calorie trends without spreadsheet energy.',
  },
  Foods: {
    index: '05',
    title: 'Fuel Database',
    subtitle: 'High-density food search and editing for repeatable entries.',
  },
  Settings: {
    index: '06',
    title: 'Profile and Premium',
    subtitle: 'Targets, theme, and tier controls in the same command surface.',
  },
  Docs: {
    index: '07',
    title: 'PRD and System Notes',
    subtitle: 'Keep the design brief and implementation boundary visible.',
  },
};

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

  const currentMeta = screenMeta[screen];
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  async function handleLogout() {
    await logout();
    setSessionEmail(null);
  }

  if (loading || !settings) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentSecondary} />
      </View>
    );
  }

  if (!sessionEmail) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
          <View style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.drawerEyebrow, { color: colors.accentSecondary }]}>KINETIC LAB NAV</Text>
            <Text style={[styles.drawerTitle, { color: colors.text }]}>Switch command views</Text>
            <Text style={[styles.drawerSubtitle, { color: colors.muted }]}>{sessionEmail}</Text>

            <DrawerSection
              title="Primary"
              screens={primaryScreens}
              currentScreen={screen}
              onSelect={(nextScreen) => {
                setScreen(nextScreen);
                setDrawerOpen(false);
              }}
            />

            <DrawerSection
              title="Library"
              screens={secondaryScreens}
              currentScreen={screen}
              onSelect={(nextScreen) => {
                setScreen(nextScreen);
                setDrawerOpen(false);
              }}
            />

            <Pressable style={[styles.signOutButton, { backgroundColor: colors.accent }]} onPress={() => void handleLogout()}>
              <Text style={styles.signOutLabel}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.appFrame}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heroTopRow}>
              <Pressable
                style={[styles.menuButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                onPress={() => setDrawerOpen(true)}
              >
                <Text style={[styles.menuButtonLabel, { color: colors.text }]}>Menu</Text>
              </Pressable>

              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: colors.accentSecondary }]}>
                  {currentMeta.index} / NUTRISTATS REDESIGN
                </Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>{currentMeta.title}</Text>
                <Text style={[styles.heroSubtitle, { color: colors.muted }]}>{currentMeta.subtitle}</Text>
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <HeroMetric label="Athlete" value={sessionEmail.split('@')[0] || sessionEmail} helper={todayLabel} />
              <HeroMetric label="Tier" value={settings.subscriptionTier.toUpperCase()} helper="profile state" />
              <HeroMetric label="Theme" value={settings.theme.toUpperCase()} helper="visual mode" />
            </View>
          </View>

          {screen === 'Home' ? (
            <HomeScreen settings={settings} reportsVersion={reportsVersion} onNavigate={setScreen} />
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
          {screen === 'Foods' ? <FoodsScreen onFoodsChanged={() => setFoodsVersion((value) => value + 1)} /> : null}
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

        <BottomTabBar screen={screen} onChange={setScreen} onMore={() => setDrawerOpen(true)} />
      </View>
    </SafeAreaView>
  );

  function HeroMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
    return (
      <View style={[styles.heroMetric, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.heroMetricLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.heroMetricValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.heroMetricHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }

  function DrawerSection({
    title,
    screens,
    currentScreen,
    onSelect,
  }: {
    title: string;
    screens: AppScreen[];
    currentScreen: AppScreen;
    onSelect: (screen: AppScreen) => void;
  }) {
    return (
      <View style={styles.drawerGroup}>
        <Text style={[styles.drawerGroupTitle, { color: colors.muted }]}>{title}</Text>
        {screens.map((item) => {
          const active = item === currentScreen;
          return (
            <Pressable
              key={item}
              onPress={() => onSelect(item)}
              style={[
                styles.drawerItem,
                {
                  backgroundColor: active ? colors.surfaceMuted : colors.background,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.drawerItemIndex, { color: active ? colors.accent : colors.muted }]}>
                {screenMeta[item].index}
              </Text>
              <View style={styles.drawerItemCopy}>
                <Text style={[styles.drawerItemTitle, { color: colors.text }]}>{screenMeta[item].title}</Text>
                <Text style={[styles.drawerItemBody, { color: colors.muted }]}>{screenMeta[item].subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFrame: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 18,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  menuButton: {
    minWidth: 78,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  menuButtonLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMetric: {
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  heroMetricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  heroMetricHelper: {
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: 330,
    borderLeftWidth: 1,
    padding: 18,
    gap: 16,
  },
  drawerEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  drawerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  drawerSubtitle: {
    fontSize: 13,
  },
  drawerGroup: {
    gap: 10,
  },
  drawerGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  drawerItem: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  drawerItemIndex: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    paddingTop: 2,
  },
  drawerItemCopy: {
    flex: 1,
    gap: 4,
  },
  drawerItemTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  drawerItemBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  signOutButton: {
    marginTop: 'auto',
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
