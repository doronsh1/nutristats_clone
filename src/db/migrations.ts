import { Platform } from 'react-native';
import { execute } from './index';

export async function runMigrations() {
  if (Platform.OS === 'web') {
    return;
  }

  await execute('PRAGMA foreign_keys = ON;');

  await execute(
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      defaultCalorieGoal REAL NOT NULL,
      defaultProteinTarget REAL NOT NULL,
      defaultFatTarget REAL NOT NULL,
      defaultCarbTarget REAL NOT NULL,
      preferredMealCount INTEGER NOT NULL,
      theme TEXT NOT NULL,
      subscriptionTier TEXT NOT NULL DEFAULT 'free',
      units TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );`
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );`
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      scope TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'canonical',
      baseFoodId TEXT,
      servingSize REAL NOT NULL,
      servingUnit TEXT NOT NULL,
      calories REAL NOT NULL,
      carbs REAL NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );`
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS diary_days (
      date TEXT PRIMARY KEY NOT NULL,
      calorieGoal REAL NOT NULL,
      proteinTarget REAL NOT NULL,
      fatTarget REAL NOT NULL,
      carbTarget REAL NOT NULL,
      manualCalorieAdjustment REAL NOT NULL,
      notes TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );`
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      mealIndex INTEGER NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(date, mealIndex),
      FOREIGN KEY (date) REFERENCES diary_days(date) ON DELETE CASCADE
    );`
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      mealId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      foodItemId TEXT,
      amount REAL NOT NULL,
      amountUnit TEXT NOT NULL,
      servingSize REAL NOT NULL,
      servingCalories REAL NOT NULL,
      servingCarbs REAL NOT NULL,
      servingProtein REAL NOT NULL,
      servingFat REAL NOT NULL,
      calories REAL NOT NULL,
      carbs REAL NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      rowOrder INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (mealId) REFERENCES meals(id) ON DELETE CASCADE
    );`
  );

  await execute(`ALTER TABLE settings ADD COLUMN subscriptionTier TEXT NOT NULL DEFAULT 'free';`).catch(() => {});
  await execute(`ALTER TABLE foods ADD COLUMN barcode TEXT;`).catch(() => {});
  await execute(`ALTER TABLE foods ADD COLUMN scope TEXT NOT NULL DEFAULT 'user';`).catch(() => {});
  await execute(`ALTER TABLE foods ADD COLUMN status TEXT NOT NULL DEFAULT 'canonical';`).catch(() => {});
  await execute(`ALTER TABLE foods ADD COLUMN baseFoodId TEXT;`).catch(() => {});
}
