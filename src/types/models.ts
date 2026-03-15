export type ThemePreference = 'system' | 'light' | 'dark';
export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type FoodCatalogScope = 'user' | 'shared' | 'api';
export type FoodReviewStatus = 'canonical' | 'pending_review' | 'external';

export type AppScreen = 'Home' | 'Nutrition' | 'Workout' | 'Foods' | 'Reports' | 'Settings' | 'Docs';

export type NutritionValues = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export type UserSettings = {
  defaultCalorieGoal: number;
  defaultProteinTarget: number;
  defaultFatTarget: number;
  defaultCarbTarget: number;
  preferredMealCount: number;
  theme: ThemePreference;
  subscriptionTier: SubscriptionTier;
  units: 'grams';
};

export type FoodItem = {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  scope: FoodCatalogScope;
  status: FoodReviewStatus;
  baseFoodId?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: number;
  updatedAt: number;
};

export type FoodUpdateRequest = {
  id: string;
  foodId: string;
  proposedByFoodId: string;
  proposedBySource: FoodCatalogScope;
  createdAt: number;
  changes: Partial<Pick<FoodItem, 'name' | 'brand' | 'barcode' | 'servingSize' | 'servingUnit' | 'calories' | 'carbs' | 'protein' | 'fat'>>;
};

export type MealEntry = NutritionValues & {
  id: string;
  itemName: string;
  foodItemId?: string | null;
  amount: number;
  amountUnit: string;
  servingSize: number;
  servingCalories: number;
  servingCarbs: number;
  servingProtein: number;
  servingFat: number;
  rowOrder: number;
};

export type DiaryMeal = {
  id: string;
  mealIndex: number;
  title: string;
  entries: MealEntry[];
};

export type DiaryDay = {
  date: string;
  calorieGoal: number;
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  manualCalorieAdjustment: number;
  notes?: string | null;
  meals: DiaryMeal[];
};

export type MacroBreakdown = {
  grams: number;
  calories: number;
  percentage: number;
  delta: number;
};

export type DaySummary = {
  totals: NutritionValues;
  goalCalories: number;
  caloriesDelta: number;
  protein: MacroBreakdown;
  carbs: MacroBreakdown;
  fat: MacroBreakdown;
};

export type ReportDay = {
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  entryCount: number;
  goalCalories: number;
};

export type ReportSummary = {
  rangeDays: number;
  averageCalories: number;
  averageCarbs: number;
  averageProtein: number;
  averageFat: number;
  loggingStreak: number;
  loggedDays: number;
  recentDays: ReportDay[];
};
