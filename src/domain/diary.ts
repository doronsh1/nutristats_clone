import type { DiaryDay, DiaryMeal, FoodItem, MealEntry, UserSettings } from '../types/models';
import { createId } from './ids';
import { deriveCaloriesFromTargets } from './calculations';

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function createEmptyEntry(rowOrder: number): MealEntry {
  return {
    id: createId('entry'),
    itemName: '',
    foodItemId: null,
    amount: 1,
    amountUnit: 'serving',
    servingSize: 1,
    servingCalories: 0,
    servingCarbs: 0,
    servingProtein: 0,
    servingFat: 0,
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    rowOrder,
  };
}

export function createEmptyMeal(mealIndex: number): DiaryMeal {
  return {
    id: createId('meal'),
    mealIndex,
    title: mealIndex === 0 ? 'Breakfast' : `Meal ${mealIndex + 1}`,
    entries: [createEmptyEntry(0)],
  };
}

export function createDefaultDiaryDay(date: string, settings: UserSettings): DiaryDay {
  return {
    date,
    calorieGoal:
      settings.defaultCalorieGoal ||
      deriveCaloriesFromTargets(
        settings.defaultProteinTarget,
        settings.defaultCarbTarget,
        settings.defaultFatTarget
      ),
    proteinTarget: settings.defaultProteinTarget,
    fatTarget: settings.defaultFatTarget,
    carbTarget: settings.defaultCarbTarget,
    manualCalorieAdjustment: 0,
    notes: null,
    meals: Array.from({ length: settings.preferredMealCount }, (_, index) => createEmptyMeal(index)),
  };
}

export function applyFoodToEntry(entry: MealEntry, food: FoodItem): MealEntry {
  return {
    ...entry,
    itemName: food.name,
    foodItemId: food.id,
    amount: 1,
    amountUnit: food.servingUnit,
    servingSize: food.servingSize,
    servingCalories: food.calories,
    servingCarbs: food.carbs,
    servingProtein: food.protein,
    servingFat: food.fat,
    calories: food.calories,
    carbs: food.carbs,
    protein: food.protein,
    fat: food.fat,
  };
}

export function syncEntryFromAmount(entry: MealEntry, amount: number): MealEntry {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  return {
    ...entry,
    amount: safeAmount,
    calories: round(entry.servingCalories * safeAmount),
    carbs: round(entry.servingCarbs * safeAmount),
    protein: round(entry.servingProtein * safeAmount),
    fat: round(entry.servingFat * safeAmount),
  };
}

export function syncEntryServingFromMacros(entry: MealEntry): MealEntry {
  const divisor = entry.amount > 0 ? entry.amount : 1;
  return {
    ...entry,
    servingCalories: round(entry.calories / divisor),
    servingCarbs: round(entry.carbs / divisor),
    servingProtein: round(entry.protein / divisor),
    servingFat: round(entry.fat / divisor),
  };
}

export function normalizeMealEntries(meal: DiaryMeal): DiaryMeal {
  const entries = meal.entries.length > 0 ? meal.entries : [createEmptyEntry(0)];
  return {
    ...meal,
    entries: entries.map((entry, index) => ({
      ...entry,
      rowOrder: index,
    })),
  };
}

export function normalizeDiaryDay(day: DiaryDay, mealCount: number): DiaryDay {
  const meals = [...day.meals]
    .sort((left, right) => left.mealIndex - right.mealIndex)
    .slice(0, mealCount);

  while (meals.length < mealCount) {
    meals.push(createEmptyMeal(meals.length));
  }

  return {
    ...day,
    meals: meals.map(normalizeMealEntries),
  };
}
