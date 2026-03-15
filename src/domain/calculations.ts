import type { DaySummary, DiaryDay, DiaryMeal, MacroBreakdown, MealEntry, NutritionValues } from '../types/models';

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function emptyNutrition(): NutritionValues {
  return { calories: 0, carbs: 0, protein: 0, fat: 0 };
}

export function sumNutrition(items: NutritionValues[]) {
  return items.reduce(
    (acc, item) => ({
      calories: round(acc.calories + item.calories),
      carbs: round(acc.carbs + item.carbs),
      protein: round(acc.protein + item.protein),
      fat: round(acc.fat + item.fat),
    }),
    emptyNutrition()
  );
}

export function calculateMealTotals(entries: MealEntry[]) {
  return sumNutrition(entries);
}

export function calculateDayTotals(meals: DiaryMeal[]) {
  return sumNutrition(meals.map((meal) => calculateMealTotals(meal.entries)));
}

export function macroCalories(grams: number, macro: 'protein' | 'carbs' | 'fat') {
  const factor = macro === 'fat' ? 9 : 4;
  return round(grams * factor);
}

export function macroPercentages(totals: NutritionValues) {
  const proteinCalories = macroCalories(totals.protein, 'protein');
  const carbCalories = macroCalories(totals.carbs, 'carbs');
  const fatCalories = macroCalories(totals.fat, 'fat');
  const total = proteinCalories + carbCalories + fatCalories;

  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: round((proteinCalories / total) * 100),
    carbs: round((carbCalories / total) * 100),
    fat: round((fatCalories / total) * 100),
  };
}

function buildMacroBreakdown(actualGrams: number, targetGrams: number, macro: 'protein' | 'carbs' | 'fat', percentage: number): MacroBreakdown {
  return {
    grams: round(actualGrams),
    calories: macroCalories(actualGrams, macro),
    percentage,
    delta: round(actualGrams - targetGrams),
  };
}

export function calculateDaySummary(day: DiaryDay): DaySummary {
  const totals = calculateDayTotals(day.meals);
  const percentages = macroPercentages(totals);
  const goalCalories = round(day.calorieGoal + day.manualCalorieAdjustment);

  return {
    totals,
    goalCalories,
    caloriesDelta: round(totals.calories - goalCalories),
    protein: buildMacroBreakdown(totals.protein, day.proteinTarget, 'protein', percentages.protein),
    carbs: buildMacroBreakdown(totals.carbs, day.carbTarget, 'carbs', percentages.carbs),
    fat: buildMacroBreakdown(totals.fat, day.fatTarget, 'fat', percentages.fat),
  };
}

export function deriveCaloriesFromTargets(protein: number, carbs: number, fat: number) {
  return round(protein * 4 + carbs * 4 + fat * 9);
}
