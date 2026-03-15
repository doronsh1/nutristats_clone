import { createId } from '../domain/ids';
import type { FoodItem } from '../types/models';

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
};

function numberOrZero(value: unknown) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
}

function mapProductToFood(product: OpenFoodFactsProduct): FoodItem | null {
  const name = product.product_name?.trim();
  if (!name) {
    return null;
  }

  const nutriments = product.nutriments ?? {};
  return {
    id: createId('api_food'),
    name,
    brand: product.brands?.trim() || null,
    barcode: product.code?.trim() || null,
    scope: 'api',
    status: 'external',
    baseFoodId: null,
    servingSize: 100,
    servingUnit: 'g',
    calories: numberOrZero(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal']),
    carbs: numberOrZero(nutriments.carbohydrates_100g ?? nutriments.carbohydrates),
    protein: numberOrZero(nutriments.proteins_100g ?? nutriments.proteins),
    fat: numberOrZero(nutriments.fat_100g ?? nutriments.fat),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function safeJsonFetch<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function searchOpenFoodFacts(query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const data = await safeJsonFetch<{ products?: OpenFoodFactsProduct[] }>(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      normalized
    )}&search_simple=1&action=process&json=1&page_size=8`
  );

  return (data?.products ?? [])
    .map((product) => mapProductToFood(product))
    .filter((food): food is FoodItem => Boolean(food));
}

export async function lookupOpenFoodFactsBarcode(barcode: string) {
  const normalized = barcode.trim();
  if (!normalized) {
    return null;
  }

  const data = await safeJsonFetch<{ product?: OpenFoodFactsProduct; status?: number }>(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalized)}.json`
  );

  if (!data?.product || data.status === 0) {
    return null;
  }

  return mapProductToFood({
    ...data.product,
    code: normalized,
  });
}
