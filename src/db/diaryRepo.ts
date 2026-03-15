import { Platform } from 'react-native';
import { execute, executeBatch } from './index';
import { createDefaultDiaryDay, normalizeDiaryDay } from '../domain/diary';
import { createId } from '../domain/ids';
import { getMeta, setMeta } from './metaRepo';
import type { DiaryDay, DiaryMeal, MealEntry, ReportSummary, UserSettings } from '../types/models';
import { getTodayKey } from '../domain/dates';
import { getAllWebDiaryDays, getWebDiaryStub, saveWebDiaryDay } from './webStore';

type DayRow = Omit<DiaryDay, 'meals'>;
type MealRow = {
  id: string;
  date: string;
  mealIndex: number;
  title: string;
};

type EntryRow = MealEntry & {
  mealId: string;
};

const CLIPBOARD_KEY = 'meal_clipboard';

async function ensureDiaryDayExists(date: string, settings: UserSettings) {
  if (Platform.OS === 'web') {
    const existing = getWebDiaryStub(date);
    if (!existing.day) {
      saveWebDiaryDay(createDefaultDiaryDay(date, settings));
    }
    return;
  }

  const rows = (await execute('SELECT date FROM diary_days WHERE date = ? LIMIT 1;', [date])) as Array<{ date: string }>;
  if (rows.length === 0) {
    const now = Date.now();
    const day = createDefaultDiaryDay(date, settings);
    await execute(
      `INSERT INTO diary_days (
        date, calorieGoal, proteinTarget, fatTarget, carbTarget, manualCalorieAdjustment, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        day.date,
        day.calorieGoal,
        day.proteinTarget,
        day.fatTarget,
        day.carbTarget,
        day.manualCalorieAdjustment,
        day.notes ?? null,
        now,
        now,
      ]
    );
  }

  for (let index = 0; index < settings.preferredMealCount; index += 1) {
    await execute(
      `INSERT INTO meals (id, date, mealIndex, title, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(date, mealIndex) DO NOTHING;`,
      [
        createId('meal'),
        date,
        index,
        index === 0 ? 'Breakfast' : `Meal ${index + 1}`,
        Date.now(),
        Date.now(),
      ]
    );
  }
}

export async function getDiaryDay(date: string, settings: UserSettings): Promise<DiaryDay> {
  await ensureDiaryDayExists(date, settings);

  if (Platform.OS === 'web') {
    const { day, meals } = getWebDiaryStub(date);
    return normalizeDiaryDay(
      {
        ...(day ?? createDefaultDiaryDay(date, settings)),
        meals,
      },
      settings.preferredMealCount
    );
  }

  const dayRows = (await execute(
    `SELECT date, calorieGoal, proteinTarget, fatTarget, carbTarget, manualCalorieAdjustment, notes
     FROM diary_days WHERE date = ? LIMIT 1;`,
    [date]
  )) as DayRow[];

  const mealRows = (await execute(
    `SELECT id, date, mealIndex, title
     FROM meals WHERE date = ?
     ORDER BY mealIndex ASC;`,
    [date]
  )) as MealRow[];

  const entryRows = (await execute(
    `SELECT id, mealId, itemName, foodItemId, amount, amountUnit, servingSize, servingCalories, servingCarbs,
            servingProtein, servingFat, calories, carbs, protein, fat, rowOrder
     FROM meal_entries
     WHERE mealId IN (SELECT id FROM meals WHERE date = ?)
     ORDER BY mealId ASC, rowOrder ASC;`,
    [date]
  )) as EntryRow[];

  const meals = mealRows.map((mealRow) => ({
    id: mealRow.id,
    mealIndex: mealRow.mealIndex,
    title: mealRow.title,
    entries: entryRows
      .filter((entry) => entry.mealId === mealRow.id)
      .map(({ mealId: _mealId, ...entry }) => entry),
  }));

  return normalizeDiaryDay(
    {
      ...dayRows[0],
      meals,
    },
    settings.preferredMealCount
  );
}

export async function saveDiaryDay(day: DiaryDay) {
  const normalized = normalizeDiaryDay(day, day.meals.length);
  if (Platform.OS === 'web') {
    saveWebDiaryDay(normalized);
    return normalized;
  }

  const now = Date.now();

  const statements: Array<{ sql: string; params?: Array<string | number | null> }> = [
    {
      sql: `UPDATE diary_days
            SET calorieGoal = ?, proteinTarget = ?, fatTarget = ?, carbTarget = ?, manualCalorieAdjustment = ?, notes = ?, updatedAt = ?
            WHERE date = ?;`,
      params: [
        normalized.calorieGoal,
        normalized.proteinTarget,
        normalized.fatTarget,
        normalized.carbTarget,
        normalized.manualCalorieAdjustment,
        normalized.notes ?? null,
        now,
        normalized.date,
      ],
    },
  ];

  for (const meal of normalized.meals) {
    statements.push({
      sql: `INSERT INTO meals (id, date, mealIndex, title, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, mealIndex) DO UPDATE SET title = excluded.title, updatedAt = excluded.updatedAt;`,
      params: [meal.id, normalized.date, meal.mealIndex, meal.title, now, now],
    });
    statements.push({
      sql: 'DELETE FROM meal_entries WHERE mealId = ?;',
      params: [meal.id],
    });

    for (const entry of meal.entries) {
      statements.push({
        sql: `INSERT INTO meal_entries (
                id, mealId, itemName, foodItemId, amount, amountUnit, servingSize, servingCalories, servingCarbs,
                servingProtein, servingFat, calories, carbs, protein, fat, rowOrder, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params: [
          entry.id,
          meal.id,
          entry.itemName,
          entry.foodItemId ?? null,
          entry.amount,
          entry.amountUnit,
          entry.servingSize,
          entry.servingCalories,
          entry.servingCarbs,
          entry.servingProtein,
          entry.servingFat,
          entry.calories,
          entry.carbs,
          entry.protein,
          entry.fat,
          entry.rowOrder,
          now,
          now,
        ],
      });
    }
  }

  await executeBatch(statements);
  return normalized;
}

export async function setClipboardMeal(meal: DiaryMeal) {
  await setMeta(CLIPBOARD_KEY, meal);
}

export async function getClipboardMeal() {
  return getMeta<DiaryMeal>(CLIPBOARD_KEY);
}

export async function getReportSummary(rangeDays: number): Promise<ReportSummary> {
  if (Platform.OS === 'web') {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - rangeDays + 1);
    const thresholdKey = threshold.toISOString().slice(0, 10);
    const rows = getAllWebDiaryDays()
      .filter((day) => day.date >= thresholdKey)
      .sort((left, right) => right.date.localeCompare(left.date))
      .map((day) => {
        const totals = day.meals.flatMap((meal) => meal.entries).reduce(
          (acc, entry) => ({
            calories: acc.calories + entry.calories,
            carbs: acc.carbs + entry.carbs,
            protein: acc.protein + entry.protein,
            fat: acc.fat + entry.fat,
            entryCount: acc.entryCount + (entry.itemName.trim() ? 1 : 0),
          }),
          { calories: 0, carbs: 0, protein: 0, fat: 0, entryCount: 0 }
        );

        return {
          date: day.date,
          goalCalories: day.calorieGoal,
          calories: totals.calories,
          carbs: totals.carbs,
          protein: totals.protein,
          fat: totals.fat,
          entryCount: totals.entryCount,
        };
      });

    const loggedDays = rows.filter((row) => row.entryCount > 0).length;
    const denominator = loggedDays || 1;
    const averageCalories = rows.reduce((sum, row) => sum + row.calories, 0) / denominator;
    const averageCarbs = rows.reduce((sum, row) => sum + row.carbs, 0) / denominator;
    const averageProtein = rows.reduce((sum, row) => sum + row.protein, 0) / denominator;
    const averageFat = rows.reduce((sum, row) => sum + row.fat, 0) / denominator;

    const sortedAsc = [...rows].sort((left, right) => left.date.localeCompare(right.date));
    let loggingStreak = 0;
    let cursor = getTodayKey();

    for (let index = sortedAsc.length - 1; index >= 0; index -= 1) {
      const row = sortedAsc[index];
      if (row.date !== cursor || row.entryCount === 0) {
        break;
      }
      loggingStreak += 1;
      const date = new Date(`${cursor}T12:00:00`);
      date.setDate(date.getDate() - 1);
      cursor = date.toISOString().slice(0, 10);
    }

    return {
      rangeDays,
      averageCalories: Math.round(averageCalories),
      averageCarbs: Math.round(averageCarbs * 10) / 10,
      averageProtein: Math.round(averageProtein * 10) / 10,
      averageFat: Math.round(averageFat * 10) / 10,
      loggingStreak,
      loggedDays,
      recentDays: rows,
    };
  }

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - rangeDays + 1);
  const thresholdKey = threshold.toISOString().slice(0, 10);

  const rows = (await execute(
    `SELECT d.date as date,
            d.calorieGoal as goalCalories,
            COALESCE(SUM(e.calories), 0) as calories,
            COALESCE(SUM(e.carbs), 0) as carbs,
            COALESCE(SUM(e.protein), 0) as protein,
            COALESCE(SUM(e.fat), 0) as fat,
            COUNT(e.id) as entryCount
     FROM diary_days d
     LEFT JOIN meals m ON m.date = d.date
     LEFT JOIN meal_entries e ON e.mealId = m.id
     WHERE d.date >= ?
     GROUP BY d.date
     ORDER BY d.date DESC;`,
    [thresholdKey]
  )) as Array<{
    date: string;
    goalCalories: number;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    entryCount: number;
  }>;

  const loggedDays = rows.filter((row) => row.entryCount > 0).length;
  const denominator = loggedDays || 1;
  const averageCalories = rows.reduce((sum, row) => sum + row.calories, 0) / denominator;
  const averageCarbs = rows.reduce((sum, row) => sum + row.carbs, 0) / denominator;
  const averageProtein = rows.reduce((sum, row) => sum + row.protein, 0) / denominator;
  const averageFat = rows.reduce((sum, row) => sum + row.fat, 0) / denominator;

  const sortedAsc = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  let loggingStreak = 0;
  let cursor = getTodayKey();

  for (let index = sortedAsc.length - 1; index >= 0; index -= 1) {
    const row = sortedAsc[index];
    if (row.date !== cursor || row.entryCount === 0) {
      break;
    }
    loggingStreak += 1;
    const date = new Date(`${cursor}T12:00:00`);
    date.setDate(date.getDate() - 1);
    cursor = date.toISOString().slice(0, 10);
  }

  return {
    rangeDays,
    averageCalories: Math.round(averageCalories),
    averageCarbs: Math.round(averageCarbs * 10) / 10,
    averageProtein: Math.round(averageProtein * 10) / 10,
    averageFat: Math.round(averageFat * 10) / 10,
    loggingStreak,
    loggedDays,
    recentDays: rows,
  };
}
