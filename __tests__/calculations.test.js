const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateDaySummary,
  calculateMealTotals,
  deriveCaloriesFromTargets,
  macroPercentages,
} = require('../.tmp-tests/src/domain/calculations.js');

test('calculateMealTotals sums entry nutrition', () => {
  const totals = calculateMealTotals([
    {
      id: 'a',
      itemName: 'Eggs',
      foodItemId: null,
      amount: 2,
      amountUnit: 'egg',
      servingSize: 1,
      servingCalories: 72,
      servingCarbs: 0.4,
      servingProtein: 6.3,
      servingFat: 4.8,
      calories: 144,
      carbs: 0.8,
      protein: 12.6,
      fat: 9.6,
      rowOrder: 0,
    },
    {
      id: 'b',
      itemName: 'Toast',
      foodItemId: null,
      amount: 1,
      amountUnit: 'slice',
      servingSize: 1,
      servingCalories: 80,
      servingCarbs: 15,
      servingProtein: 3,
      servingFat: 1,
      calories: 80,
      carbs: 15,
      protein: 3,
      fat: 1,
      rowOrder: 1,
    },
  ]);

  assert.deepEqual(totals, {
    calories: 224,
    carbs: 15.8,
    protein: 15.6,
    fat: 10.6,
  });
});

test('macroPercentages handles macro calorie shares', () => {
  const percentages = macroPercentages({
    calories: 0,
    carbs: 200,
    protein: 150,
    fat: 50,
  });

  assert.deepEqual(percentages, {
    protein: 32.4,
    carbs: 43.2,
    fat: 24.3,
  });
});

test('calculateDaySummary returns deltas and goal calories', () => {
  const day = {
    date: '2026-03-14',
    calorieGoal: 2200,
    proteinTarget: 180,
    fatTarget: 70,
    carbTarget: 220,
    manualCalorieAdjustment: 100,
    notes: null,
    meals: [
      {
        id: 'meal_1',
        mealIndex: 0,
        title: 'Breakfast',
        entries: [
          {
            id: 'a',
            itemName: 'Yogurt',
            foodItemId: null,
            amount: 1,
            amountUnit: 'cup',
            servingSize: 1,
            servingCalories: 200,
            servingCarbs: 20,
            servingProtein: 25,
            servingFat: 4,
            calories: 200,
            carbs: 20,
            protein: 25,
            fat: 4,
            rowOrder: 0,
          },
        ],
      },
    ],
  };

  const summary = calculateDaySummary(day);

  assert.equal(summary.goalCalories, 2300);
  assert.equal(summary.caloriesDelta, -2100);
  assert.equal(summary.protein.delta, -155);
});

test('deriveCaloriesFromTargets converts grams to calories', () => {
  assert.equal(deriveCaloriesFromTargets(180, 220, 70), 2230);
});
