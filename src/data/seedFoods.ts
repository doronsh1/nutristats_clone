import type { FoodItem } from '../types/models';

const now = Date.now();

type SeedFood = Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt' | 'scope' | 'status' | 'baseFoodId'>;

export const seedFoods: SeedFood[] = [
  { name: 'Psyllium Husk Powder', brand: null, servingSize: 1, servingUnit: 'tbsp', calories: 20, carbs: 8, protein: 0, fat: 0 },
  { name: 'Honey', brand: null, servingSize: 1, servingUnit: 'tsp', calories: 21, carbs: 6, protein: 0, fat: 0 },
  { name: 'Rice Cakes Brown Rice', brand: null, servingSize: 1, servingUnit: 'cake', calories: 35, carbs: 7, protein: 1, fat: 0.3 },
  { name: 'Turkey Salami', brand: null, servingSize: 28, servingUnit: 'g', calories: 70, carbs: 1, protein: 9, fat: 3 },
  { name: 'Milk 0%', brand: null, servingSize: 240, servingUnit: 'ml', calories: 83, carbs: 12, protein: 8, fat: 0.2 },
  { name: 'Kind PB Granola', brand: 'KIND', servingSize: 50, servingUnit: 'g', calories: 230, carbs: 29, protein: 5, fat: 11 },
  { name: 'Bread Flour', brand: null, servingSize: 30, servingUnit: 'g', calories: 110, carbs: 23, protein: 3, fat: 0.2 },
  { name: "Siggi's Yogurt 0%", brand: 'Siggi’s', servingSize: 150, servingUnit: 'g', calories: 90, carbs: 9, protein: 15, fat: 0 },
  { name: 'White Cheese', brand: null, servingSize: 30, servingUnit: 'g', calories: 50, carbs: 1, protein: 6, fat: 2.5 },
  { name: 'Smoked Salmon', brand: null, servingSize: 85, servingUnit: 'g', calories: 117, carbs: 0, protein: 18, fat: 4 },
  { name: 'Apple Medium', brand: null, servingSize: 1, servingUnit: 'item', calories: 95, carbs: 25, protein: 0.5, fat: 0.3 },
  { name: 'Almond Butter', brand: null, servingSize: 16, servingUnit: 'g', calories: 98, carbs: 3, protein: 3.4, fat: 9 },
  { name: 'Raw Salmon', brand: null, servingSize: 100, servingUnit: 'g', calories: 208, carbs: 0, protein: 20, fat: 13 },
  { name: 'White Rice Cooked', brand: null, servingSize: 100, servingUnit: 'g', calories: 130, carbs: 28, protein: 2.7, fat: 0.3 },
  { name: 'Avocado', brand: null, servingSize: 50, servingUnit: 'g', calories: 80, carbs: 4, protein: 1, fat: 7.5 },
  { name: 'Lettuce', brand: null, servingSize: 100, servingUnit: 'g', calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2 },
  { name: 'Pro Feel Yogurt', brand: 'Lindahls', servingSize: 150, servingUnit: 'g', calories: 95, carbs: 8, protein: 18, fat: 0.2 },
  { name: 'Greek Yogurt 2%', brand: null, servingSize: 170, servingUnit: 'g', calories: 146, carbs: 6, protein: 20, fat: 4 },
  { name: 'Egg Whole', brand: null, servingSize: 1, servingUnit: 'egg', calories: 72, carbs: 0.4, protein: 6.3, fat: 4.8 },
  { name: 'Chicken Breast Cooked', brand: null, servingSize: 100, servingUnit: 'g', calories: 165, carbs: 0, protein: 31, fat: 3.6 },
  { name: 'Oats', brand: null, servingSize: 40, servingUnit: 'g', calories: 156, carbs: 27, protein: 5, fat: 3 },
  { name: 'Cottage Cheese 5%', brand: null, servingSize: 100, servingUnit: 'g', calories: 98, carbs: 3.4, protein: 11, fat: 4.3 },
  { name: 'Banana', brand: null, servingSize: 1, servingUnit: 'item', calories: 105, carbs: 27, protein: 1.3, fat: 0.4 },
  { name: 'Peanut Butter', brand: null, servingSize: 16, servingUnit: 'g', calories: 94, carbs: 3.2, protein: 3.6, fat: 8 },
  { name: 'Tuna in Water', brand: null, servingSize: 100, servingUnit: 'g', calories: 116, carbs: 0, protein: 26, fat: 1 },
  { name: 'Sweet Potato', brand: null, servingSize: 100, servingUnit: 'g', calories: 90, carbs: 21, protein: 2, fat: 0.2 }
];

export function withSeedMetadata(idFactory: (name: string) => string): FoodItem[] {
  return seedFoods.map((food) => ({
    ...food,
    id: idFactory(food.name),
    scope: 'shared',
    status: 'canonical',
    baseFoodId: null,
    createdAt: now,
    updatedAt: now,
  }));
}
