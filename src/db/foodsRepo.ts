import { Platform } from 'react-native';
import { withSeedMetadata } from '../data/seedFoods';
import { execute } from './index';
import { createId } from '../domain/ids';
import type { FoodCatalogScope, FoodItem, FoodUpdateRequest } from '../types/models';
import { deleteWebFood, listWebUpdateRequests, readWebDb, saveWebFood, saveWebUpdateRequest, writeWebDb } from './webStore';
import { lookupOpenFoodFactsBarcode, searchOpenFoodFacts } from '../services/openFoodFacts';

type FoodRow = FoodItem;

function scopeRank(scope?: FoodCatalogScope) {
  if (scope === 'user') {
    return 0;
  }
  if (scope === 'shared') {
    return 1;
  }
  return 2;
}

function levenshtein(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }
  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, ' ').trim();
}

function scoreFood(food: FoodItem, query: string) {
  if (!query) {
    return 0;
  }

  const target = normalizeText(`${food.name} ${food.brand ?? ''} ${food.barcode ?? ''}`);
  if (target.includes(query)) {
    return 0;
  }

  const distance = levenshtein(normalizeText(food.name), query);
  return distance <= 3 ? distance + 10 : 100;
}

function searchWithinCatalog(foods: FoodItem[], query = '') {
  const normalized = normalizeText(query);

  return [...foods]
    .filter((food) => !normalized || scoreFood(food, normalized) < 100)
    .sort((left, right) => {
      const scoreDelta = scoreFood(left, normalized) - scoreFood(right, normalized);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const scopeDelta = scopeRank(left.scope) - scopeRank(right.scope);
      if (scopeDelta !== 0) {
        return scopeDelta;
      }

      return left.name.localeCompare(right.name);
    });
}

export async function ensureSeedFoods() {
  if (Platform.OS === 'web') {
    const db = readWebDb();
    if (db.foods.length > 0) {
      return;
    }
    db.foods = withSeedMetadata((name) => createId(name.toLowerCase().replace(/\W+/g, '_')));
    writeWebDb(db);
    return;
  }

  const rows = (await execute('SELECT COUNT(*) as count FROM foods;')) as Array<{ count: number }>;
  if ((rows[0]?.count ?? 0) > 0) {
    return;
  }

  const foods = withSeedMetadata((name) => createId(name.toLowerCase().replace(/\W+/g, '_')));
  for (const food of foods) {
    await saveFood(food);
  }
}

export async function listFoods(query = ''): Promise<FoodItem[]> {
  if (Platform.OS === 'web') {
    return searchWithinCatalog(readWebDb().foods, query);
  }

  const rows = (await execute(`SELECT * FROM foods ORDER BY name ASC;`)) as FoodRow[];

  return searchWithinCatalog(rows, query);
}

type FoodDraft = Omit<FoodItem, 'id' | 'brand' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  brand?: string | null;
  barcode?: string | null;
  scope?: FoodCatalogScope;
  status?: FoodItem['status'];
  baseFoodId?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

export async function saveFood(food: FoodDraft) {
  const now = Date.now();
  const complete: FoodItem = {
    id: food.id ?? createId('food'),
    name: food.name,
    brand: food.brand ?? null,
    barcode: food.barcode ?? null,
    scope: food.scope ?? 'user',
    status: food.status ?? 'canonical',
    baseFoodId: food.baseFoodId ?? null,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    calories: food.calories,
    carbs: food.carbs,
    protein: food.protein,
    fat: food.fat,
    createdAt: food.createdAt ?? now,
    updatedAt: now,
  };

  if (Platform.OS === 'web') {
    saveWebFood(complete);
    return complete;
  }

  await execute(
    `INSERT INTO foods (
      id, name, brand, barcode, scope, status, baseFoodId, servingSize, servingUnit, calories, carbs, protein, fat, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      brand = excluded.brand,
      barcode = excluded.barcode,
      scope = excluded.scope,
      status = excluded.status,
      baseFoodId = excluded.baseFoodId,
      servingSize = excluded.servingSize,
      servingUnit = excluded.servingUnit,
      calories = excluded.calories,
      carbs = excluded.carbs,
      protein = excluded.protein,
      fat = excluded.fat,
      updatedAt = excluded.updatedAt;`,
    [
      complete.id,
      complete.name,
      complete.brand ?? null,
      complete.barcode ?? null,
      complete.scope,
      complete.status,
      complete.baseFoodId ?? null,
      complete.servingSize,
      complete.servingUnit,
      complete.calories,
      complete.carbs,
      complete.protein,
      complete.fat,
      complete.createdAt,
      complete.updatedAt,
    ]
  );

  return complete;
}

export async function deleteFood(id: string) {
  if (Platform.OS === 'web') {
    deleteWebFood(id);
    return;
  }

  await execute('DELETE FROM foods WHERE id = ?;', [id]);
}

export async function findFoodByBarcode(barcode: string) {
  if (!barcode.trim()) {
    return null;
  }

  const foods = await listFoods(barcode.trim());
  const localMatch = foods.find((food) => food.barcode === barcode.trim()) ?? null;
  if (localMatch) {
    return localMatch;
  }

  return lookupOpenFoodFactsBarcode(barcode.trim());
}

export async function ensureUserFood(food: FoodItem) {
  if (food.scope === 'user') {
    return food;
  }

  const existing = (await listFoods(food.barcode || food.name)).find(
    (item) =>
      item.scope === 'user' &&
      ((food.barcode && item.barcode === food.barcode) || item.baseFoodId === food.id || item.name === food.name)
  );

  if (existing) {
    return existing;
  }

  return saveFood({
    ...food,
    id: undefined,
    scope: 'user',
    status: 'canonical',
    baseFoodId: food.id,
  });
}

export async function saveUserFoodEdit(food: FoodItem) {
  if (food.scope === 'user') {
    return saveFood(food);
  }

  const override = await saveFood({
    ...food,
    id: undefined,
    scope: 'user',
    status: 'canonical',
    baseFoodId: food.id,
  });

  const request: FoodUpdateRequest = {
    id: createId('food_review'),
    foodId: food.id,
    proposedByFoodId: override.id,
    proposedBySource: 'user',
    createdAt: Date.now(),
    changes: {
      name: override.name,
      brand: override.brand ?? null,
      barcode: override.barcode ?? null,
      servingSize: override.servingSize,
      servingUnit: override.servingUnit,
      calories: override.calories,
      carbs: override.carbs,
      protein: override.protein,
      fat: override.fat,
    },
  };

  if (Platform.OS === 'web') {
    saveWebUpdateRequest(request);
  }

  return override;
}

export async function listFoodUpdateRequests() {
  if (Platform.OS === 'web') {
    return listWebUpdateRequests();
  }

  return [];
}

export async function searchFoodsCatalog(query: string) {
  const localResults = await listFoods(query);
  if (localResults.length > 0) {
    return localResults;
  }

  return searchOpenFoodFacts(query);
}
