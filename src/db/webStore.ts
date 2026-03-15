import type { DiaryDay, DiaryMeal, FoodItem, FoodUpdateRequest, ThemePreference, UserSettings } from '../types/models';

type WebDatabase = {
  settings: UserSettings | null;
  appMeta: Record<string, string>;
  foods: FoodItem[];
  foodUpdateRequests: FoodUpdateRequest[];
  diaryDays: Record<string, Omit<DiaryDay, 'meals'>>;
  meals: Record<string, DiaryMeal[]>;
};

const STORAGE_KEY = 'nutristat_clone_web_db';
const DAY_STORAGE_PREFIX = 'nutristat_clone_web_day_';

const defaultSettings: UserSettings = {
  defaultCalorieGoal: 2200,
  defaultProteinTarget: 180,
  defaultFatTarget: 70,
  defaultCarbTarget: 220,
  preferredMealCount: 6,
  theme: 'system',
  subscriptionTier: 'free',
  units: 'grams',
};

function createEmptyDb(): WebDatabase {
  return {
    settings: null,
    appMeta: {},
    foods: [],
    foodUpdateRequests: [],
    diaryDays: {},
    meals: {},
  };
}

function normalizeFood(food: Partial<FoodItem>): FoodItem {
  return {
    id: food.id ?? 'food_missing',
    name: food.name ?? 'Unknown Food',
    brand: food.brand ?? null,
    barcode: food.barcode ?? null,
    scope: food.scope ?? 'user',
    status: food.status ?? 'canonical',
    baseFoodId: food.baseFoodId ?? null,
    servingSize: food.servingSize ?? 1,
    servingUnit: food.servingUnit ?? 'serving',
    calories: food.calories ?? 0,
    carbs: food.carbs ?? 0,
    protein: food.protein ?? 0,
    fat: food.fat ?? 0,
    createdAt: food.createdAt ?? Date.now(),
    updatedAt: food.updatedAt ?? Date.now(),
  };
}

function canUseStorage() {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

function getDayStorageKey(date: string) {
  return `${DAY_STORAGE_PREFIX}${date}`;
}

export function getDefaultSettings() {
  return defaultSettings;
}

export function readWebDb(): WebDatabase {
  if (!canUseStorage()) {
    return createEmptyDb();
  }

  const raw = globalThis.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyDb();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDatabase>;
    return {
      settings: parsed.settings ?? null,
      appMeta: parsed.appMeta ?? {},
      foods: (parsed.foods ?? []).map((food) => normalizeFood(food)),
      foodUpdateRequests: parsed.foodUpdateRequests ?? [],
      diaryDays: parsed.diaryDays ?? {},
      meals: parsed.meals ?? {},
    };
  } catch {
    return createEmptyDb();
  }
}

export function writeWebDb(db: WebDatabase) {
  if (!canUseStorage()) {
    return;
  }

  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function ensureWebSettings() {
  const db = readWebDb();
  if (!db.settings) {
    db.settings = defaultSettings;
    writeWebDb(db);
  }
}

export function getWebSettings() {
  ensureWebSettings();
  const settings = readWebDb().settings ?? defaultSettings;
  return {
    ...settings,
    subscriptionTier: settings.subscriptionTier ?? 'free',
  };
}

export function saveWebSettings(settings: UserSettings) {
  const db = readWebDb();
  db.settings = settings;
  writeWebDb(db);
}

export function getWebMeta<T = string>(key: string): T | null {
  const value = readWebDb().appMeta[key];
  if (value == null) {
    return null;
  }
  return JSON.parse(value) as T;
}

export function setWebMeta<T>(key: string, value: T) {
  const db = readWebDb();
  db.appMeta[key] = JSON.stringify(value);
  writeWebDb(db);
}

export function removeWebMeta(key: string) {
  const db = readWebDb();
  delete db.appMeta[key];
  writeWebDb(db);
}

export function getWebFoods(query = '') {
  const normalized = query.trim().toLowerCase();
  const foods = readWebDb().foods;
  if (!normalized) {
    return foods.sort((a, b) => a.name.localeCompare(b.name));
  }

  return foods
    .filter((food) => {
      const brand = (food.brand ?? '').toLowerCase();
      const barcode = food.barcode ?? '';
      return food.name.toLowerCase().includes(normalized) || brand.includes(normalized) || barcode.includes(normalized);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function saveWebFood(food: FoodItem) {
  const db = readWebDb();
  const index = db.foods.findIndex((item) => item.id === food.id);

  if (index === -1) {
    db.foods.push(food);
  } else {
    db.foods[index] = food;
  }

  writeWebDb(db);
}

export function listWebUpdateRequests() {
  return readWebDb().foodUpdateRequests;
}

export function saveWebUpdateRequest(request: FoodUpdateRequest) {
  const db = readWebDb();
  db.foodUpdateRequests.unshift(request);
  writeWebDb(db);
}

export function deleteWebFood(id: string) {
  const db = readWebDb();
  db.foods = db.foods.filter((food) => food.id !== id);
  writeWebDb(db);
}

export function getWebDiaryStub(date: string) {
  if (canUseStorage()) {
    const rawDay = globalThis.localStorage.getItem(getDayStorageKey(date));
    if (rawDay) {
      try {
        const parsed = JSON.parse(rawDay) as { day: Omit<DiaryDay, 'meals'> | null; meals: DiaryMeal[] };
        return {
          day: parsed.day ?? null,
          meals: parsed.meals ?? [],
        };
      } catch {
        // Fall through to legacy storage.
      }
    }
  }

  const db = readWebDb();
  return {
    day: db.diaryDays[date] ?? null,
    meals: db.meals[date] ?? [],
  };
}

export function saveWebDiaryDay(day: DiaryDay) {
  if (canUseStorage()) {
    const { meals, ...dayWithoutMeals } = day;
    globalThis.localStorage.setItem(
      getDayStorageKey(day.date),
      JSON.stringify({
        day: dayWithoutMeals,
        meals,
      })
    );
    return;
  }

  const db = readWebDb();
  const { meals, ...dayWithoutMeals } = day;
  db.diaryDays[day.date] = dayWithoutMeals;
  db.meals[day.date] = meals;
  writeWebDb(db);
}

export function getAllWebDiaryDays() {
  if (canUseStorage()) {
    const days: DiaryDay[] = [];

    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const key = globalThis.localStorage.key(index);
      if (!key || !key.startsWith(DAY_STORAGE_PREFIX)) {
        continue;
      }

      const raw = globalThis.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as { day: Omit<DiaryDay, 'meals'> | null; meals: DiaryMeal[] };
        if (parsed.day) {
          days.push({
            ...parsed.day,
            meals: parsed.meals ?? [],
          });
        }
      } catch {
        // Ignore malformed day snapshots.
      }
    }

    if (days.length > 0) {
      return days;
    }
  }

  const db = readWebDb();
  return Object.entries(db.diaryDays).map(([date, day]) => ({
    ...day,
    date,
    meals: db.meals[date] ?? [],
  }));
}

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}
