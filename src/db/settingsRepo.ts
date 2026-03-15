import { Platform } from 'react-native';
import { execute } from './index';
import { getDefaultSettings, getWebSettings, saveWebSettings } from './webStore';
import type { UserSettings } from '../types/models';

const DEFAULT_SETTINGS: UserSettings = getDefaultSettings();

export async function ensureSettings() {
  if (Platform.OS === 'web') {
    getWebSettings();
    return;
  }

  const rows = (await execute('SELECT id FROM settings WHERE id = 1 LIMIT 1;')) as Array<{ id: number }>;
  if (rows.length > 0) {
    return;
  }

  const now = Date.now();
  await execute(
    `INSERT INTO settings (
      id, defaultCalorieGoal, defaultProteinTarget, defaultFatTarget, defaultCarbTarget,
      preferredMealCount, theme, subscriptionTier, units, createdAt, updatedAt
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      DEFAULT_SETTINGS.defaultCalorieGoal,
      DEFAULT_SETTINGS.defaultProteinTarget,
      DEFAULT_SETTINGS.defaultFatTarget,
      DEFAULT_SETTINGS.defaultCarbTarget,
      DEFAULT_SETTINGS.preferredMealCount,
      DEFAULT_SETTINGS.theme,
      DEFAULT_SETTINGS.subscriptionTier,
      DEFAULT_SETTINGS.units,
      now,
      now,
    ]
  );
}

export async function getSettings(): Promise<UserSettings> {
  if (Platform.OS === 'web') {
    return getWebSettings();
  }

  await ensureSettings();
  const rows = (await execute(
    `SELECT defaultCalorieGoal, defaultProteinTarget, defaultFatTarget, defaultCarbTarget, preferredMealCount, theme, subscriptionTier, units
     FROM settings WHERE id = 1 LIMIT 1;`
  )) as Array<{
    defaultCalorieGoal: number;
    defaultProteinTarget: number;
    defaultFatTarget: number;
    defaultCarbTarget: number;
    preferredMealCount: number;
    theme: UserSettings['theme'];
    subscriptionTier: UserSettings['subscriptionTier'];
    units: UserSettings['units'];
  }>;

  return {
    ...(rows[0] ?? DEFAULT_SETTINGS),
    subscriptionTier: rows[0]?.subscriptionTier ?? DEFAULT_SETTINGS.subscriptionTier,
  };
}

export async function updateSettings(settings: UserSettings) {
  if (Platform.OS === 'web') {
    saveWebSettings(settings);
    return;
  }

  await ensureSettings();
  await execute(
    `UPDATE settings
     SET defaultCalorieGoal = ?, defaultProteinTarget = ?, defaultFatTarget = ?, defaultCarbTarget = ?,
         preferredMealCount = ?, theme = ?, subscriptionTier = ?, units = ?, updatedAt = ?
     WHERE id = 1;`,
    [
      settings.defaultCalorieGoal,
      settings.defaultProteinTarget,
      settings.defaultFatTarget,
      settings.defaultCarbTarget,
      settings.preferredMealCount,
      settings.theme,
      settings.subscriptionTier,
      settings.units,
      Date.now(),
    ]
  );
}
