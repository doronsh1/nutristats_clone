# Atlas Fitness OS Specs

## Architecture Plan

Build the product as a local-first Expo application with one shared React Native codebase. Native uses SQLite and web uses `localStorage` so browser development does not depend on Expo's experimental web SQLite runtime. The first release focuses on:

- `Home` as the operating dashboard
- `Nutrition` as a meal-planning and logging workflow
- `Workout` as a distinct training surface
- subscription-aware feature gates for premium modules

The code stays split into:

- `src/db`: migrations and repository functions
- `src/domain`: calculations, diary transforms, and date helpers
- `src/screens`: feature screens
- `src/components`: reusable UI blocks
- `src/theme`: palette and theme preference handling

This keeps the MVP simple while leaving clear seams for a future remote API.

## Database Schema

### `settings`

- `id INTEGER PRIMARY KEY CHECK (id = 1)`
- `defaultCalorieGoal REAL NOT NULL`
- `defaultProteinTarget REAL NOT NULL`
- `defaultFatTarget REAL NOT NULL`
- `defaultCarbTarget REAL NOT NULL`
- `preferredMealCount INTEGER NOT NULL`
- `theme TEXT NOT NULL`
- `subscriptionTier TEXT NOT NULL`
- `units TEXT NOT NULL`
- `createdAt INTEGER NOT NULL`
- `updatedAt INTEGER NOT NULL`

### `app_meta`

- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`

Used for auth session and meal clipboard storage.

### `foods`

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `brand TEXT`
- `barcode TEXT`
- `servingSize REAL NOT NULL`
- `servingUnit TEXT NOT NULL`
- `calories REAL NOT NULL`
- `carbs REAL NOT NULL`
- `protein REAL NOT NULL`
- `fat REAL NOT NULL`
- `createdAt INTEGER NOT NULL`
- `updatedAt INTEGER NOT NULL`

### `diary_days`

- `date TEXT PRIMARY KEY`
- `calorieGoal REAL NOT NULL`
- `proteinTarget REAL NOT NULL`
- `fatTarget REAL NOT NULL`
- `carbTarget REAL NOT NULL`
- `manualCalorieAdjustment REAL NOT NULL`
- `notes TEXT`
- `createdAt INTEGER NOT NULL`
- `updatedAt INTEGER NOT NULL`

### `meals`

- `id TEXT PRIMARY KEY`
- `date TEXT NOT NULL`
- `mealIndex INTEGER NOT NULL`
- `title TEXT NOT NULL`
- `createdAt INTEGER NOT NULL`
- `updatedAt INTEGER NOT NULL`
- `UNIQUE(date, mealIndex)`

### `meal_entries`

- `id TEXT PRIMARY KEY`
- `mealId TEXT NOT NULL`
- `itemName TEXT NOT NULL`
- `foodItemId TEXT`
- `amount REAL NOT NULL`
- `amountUnit TEXT NOT NULL`
- `servingSize REAL NOT NULL`
- `servingCalories REAL NOT NULL`
- `servingCarbs REAL NOT NULL`
- `servingProtein REAL NOT NULL`
- `servingFat REAL NOT NULL`
- `calories REAL NOT NULL`
- `carbs REAL NOT NULL`
- `protein REAL NOT NULL`
- `fat REAL NOT NULL`
- `rowOrder INTEGER NOT NULL`
- `createdAt INTEGER NOT NULL`
- `updatedAt INTEGER NOT NULL`

## Nutrition Page Component Tree

- `AppShell`
- `TopBar`
- `AppNavBar`
- `NutritionScreen`
- `DateNavigator`
- `QuickAddPanel`
- `BarcodeAddPanel`
- `MealTargetSelector`
- `MealCard`
- `MealEntryCard`
- `DailyTargetsPanel`
- `MealActions`

## Subscription Gating

User settings now carry a `subscriptionTier`:

- `free`
- `pro`
- `elite`

Reusable feature gates decide whether to render the real component or a locked placeholder. This is used for voice analysis and can be reused for AI coach, advanced reports, and future health analytics.

## API Contract

The MVP is local-first, so screens call repository functions directly. The repository contract mirrors the future network API:

### Auth

- `login(email, password) -> sessionEmail | null`
- `logout() -> void`
- `getSession() -> sessionEmail | null`

### Nutrition

- `getDiaryDay(date, settings) -> DiaryDay`
- `saveDiaryDay(day) -> DiaryDay`
- `getClipboardMeal() -> DiaryMeal | null`
- `setClipboardMeal(meal) -> void`
- `clearClipboardMeal() -> void`

### Foods / Barcode

- `listFoods(query?) -> FoodItem[]`
- `saveFood(foodDraft) -> FoodItem`
- `deleteFood(foodId) -> void`
- foods can optionally store `barcode`
- catalog resolution order is `user -> shared -> external`
- when a non-user food is added to a meal, a user-local copy is created automatically
- editing a shared food creates a user override and a review request rather than mutating the shared record
- nutrition quick-add can search by barcode and route missing codes into Foods DB

### Reports

- `getReportSummary(rangeDays) -> ReportSummary`

## Scope Decisions

- Included in MVP: home, nutrition planner, workout shell, barcode-linked foods, reports, settings, documentation, Firebase email auth, subscription gates
- Deferred: backend-backed shared foods, review queue moderation, voice logging, steroid analyzer depth, full AI workout planner logic, billing backend

## Backend Status

This repo still does not include a real backend service or multi-user database. Current behavior is:

- user catalog persists locally
- shared catalog is represented inside the app data model for UX and search ordering
- missing items can fall back to OpenFoodFacts

A real backend should eventually own:

- canonical shared foods
- per-user overrides
- review queue and moderation
- subscription state
- auth/session management

## Layered Catalog Rules

- user-local foods always win in search
- shared foods come next
- external API results are the final fallback layer
- adding a shared/API food to a meal automatically materializes a user-local copy
- user edits apply immediately to their own copy
- shared records remain unchanged until a review request is approved
- Persistence choice: store row-level nutrition values and per-serving snapshots to preserve historical entries if the foods DB changes later
