# NutriStats-Style Nutrition Diary App — Codex Build Instructions

## Goal

Build a **web app** similar to the attached NutriStats Food Diary page. https://nutri-stats.baseecli.com/diary.html, 

you can use user: test@test.com pass: tT1234567 to login, 

The app should let a user:

* define daily macro targets
* enter foods into multiple meals for each day
* see live totals for calories, carbs, protein, and fat
* compare actual intake vs targets
* navigate by day of week
* reuse meals with copy/paste
* clear individual meals
* maintain a personal foods database
* view reports over time
* manage settings

This should be built as a **clean MVP first**, with solid architecture so it can later grow into a production app.

---

# Product Summary

Create a nutrition tracking app with a diary-first workflow.

The main page is a **Food Diary** screen that shows:

* top navigation: Reports, Foods DB, Settings, Documentation
* user/profile area and logout
* weekday navigation (Sun–Sat with previous/next controls)
* macro target controls near the top
* a daily summary section for:

  * protein target and actuals
  * fat target and actuals
  * carb target and actuals
  * total calorie goal and consumed calories
* 6 meal sections per day
* each meal contains editable food rows and a total row

The feel should be fast, practical, and spreadsheet-like.

---

# Key Behaviors Observed From The Existing App

Recreate these behaviors:

1. **Diary organized by day**

   * User can switch between days using weekday buttons.
   * Data is stored per date.

2. **Macro target area**

   * User can set target protein level.
   * User can set target fat level.
   * User can manually adjust calories/macros.
   * App calculates macro percentages and grams.

3. **Daily summary**

   * Show protein %, grams, and calories.
   * Show fat %, grams, and calories.
   * Show carb %, grams, and calories.
   * Show overall goal and total consumed calories.
   * Show actual vs target comparison.

4. **Meal blocks**

   * 6 meals per day.
   * Each meal has an optional title/name.
   * Each meal has buttons:

     * Copy this meal
     * Paste
     * Clear

5. **Food entry table per meal**

   * Columns:

     * Item
     * Amount
     * Calories
     * Carbs
     * Protein
     * Fat
     * Optional protein grams / derived value column
   * Food name is editable.
   * Amount is editable.
   * Nutrition values auto-fill if food exists in Foods DB.
   * Totals update live.

6. **Totals**

   * Each meal has totals.
   * Entire day has totals.
   * Macro percentages update automatically.

---

# Build Strategy

Ask Codex to implement this in **phases**, not all at once.

## Phase 1 — MVP

Build:

* authentication stub or simple local login
* Food Diary page
* Foods DB page
* Settings page
* Reports page (basic)
* local persistence or SQLite/Postgres
* live macro calculations
* 6 meals per day
* add/edit/delete food rows
* food lookup from Foods DB
* copy/paste/clear meal

## Phase 2 — Better UX

Add:

* autocomplete for foods
* inline validation
* keyboard-friendly spreadsheet behavior
* clone previous day
* quick-add recent foods
* mobile-friendly layout

## Phase 3 — Power Features

Add:

* recurring meals/templates
* import/export CSV
* weekly/monthly reports
* charts
* barcode scanning later if mobile app is added
* AI suggestions later

---

# Recommended Tech Stack

Use a stack that Codex can generate quickly and reliably.

## Option A (recommended)

* **Frontend:** Next.js + TypeScript + React
* **UI:** Tailwind CSS + shadcn/ui
* **Backend:** Next.js API routes or separate Express/Nest service
* **Database:** PostgreSQL with Prisma
* **Auth:** NextAuth or Clerk
* **State/Form:** React Hook Form + Zod

## Option B (simple local MVP)

* React + Vite + TypeScript
* Express API
* SQLite with Prisma
* simple session/local auth

Tell Codex:

> Start with Option B if speed matters. Start with Option A if the goal is a polished, extensible app.

---

# Data Model

Use these core entities.

## User

* id
* email
* passwordHash
* name
* createdAt
* updatedAt

## UserSettings

* id
* userId
* defaultCaloriesGoal
* defaultProteinTargetGrams
* defaultFatTargetGrams
* defaultCarbTargetGrams
* preferredMealCount (default 6)
* units (grams/oz later)
* createdAt
* updatedAt

## DiaryDay

* id
* userId
* date
* calorieGoal
* proteinTargetGrams
* fatTargetGrams
* carbTargetGrams
* manualCalorieAdjustment
* notes (optional)
* createdAt
* updatedAt

## Meal

* id
* diaryDayId
* mealIndex (1..6)
* title
* sortOrder
* createdAt
* updatedAt

## FoodItem

Master foods database entry.

* id
* userId (nullable if system food)
* name
* brand (optional)
* servingSize
* servingUnit
* caloriesPerServing
* carbsPerServing
* proteinPerServing
* fatPerServing
* fiberPerServing (optional)
* sourceType (system/user/custom)
* createdAt
* updatedAt

## MealEntry

A food added to a meal for a specific day.

* id
* mealId
* foodItemId (nullable if free text custom row)
* customFoodName
* amount
* amountUnit
* calories
* carbs
* protein
* fat
* rowOrder
* createdAt
* updatedAt

## MealClipboard

Optional server-side copy/paste support.

* id
* userId
* serializedMealJson
* updatedAt

---

# Core Calculations

Codex should centralize nutrition calculations in pure utility functions.

## Meal totals

For each meal:

* totalCalories = sum(row.calories)
* totalCarbs = sum(row.carbs)
* totalProtein = sum(row.protein)
* totalFat = sum(row.fat)

## Day totals

Across all meals:

* dayCalories = sum(meal.totalCalories)
* dayCarbs = sum(meal.totalCarbs)
* dayProtein = sum(meal.totalProtein)
* dayFat = sum(meal.totalFat)

## Macro calories

* proteinCalories = proteinGrams * 4
* carbsCalories = carbsGrams * 4
* fatCalories = fatGrams * 9

## Macro percentages

If total macro calories > 0:

* proteinPct = proteinCalories / totalMacroCalories * 100
* carbsPct = carbsCalories / totalMacroCalories * 100
* fatPct = fatCalories / totalMacroCalories * 100

## Target comparison

* proteinDelta = actualProtein - targetProtein
* fatDelta = actualFat - targetFat
* carbsDelta = actualCarb - targetCarb
* caloriesDelta = actualCalories - goalCalories

---

# Screens To Build

## 1. Food Diary Page

Main app screen.

### Top area

* app title/logo
* nav links: Reports, Foods DB, Settings, Documentation
* user menu / logout

### Date navigation

* previous day button
* day-of-week buttons (Sun–Sat)
* current selected date display
* next day button

### Macro summary panel

Inputs:

* protein target
* fat target
* manual change / calorie adjustment

Derived values:

* protein %
* protein grams
* protein calories
* fat %
* fat grams
* fat calories
* carb %
* carb grams
* carb calories
* goal calories
* total actual calories
* actual vs target rows

### Meals section

Render 6 meal cards.
Each meal has:

* meal label (Meal 1, Meal 2, etc.)
* editable title field
* Copy button
* Paste button
* Clear button
* editable table rows
* Add row button
* total row at bottom

### Table behavior

Each row should allow:

* food name entry
* amount entry
* macro values auto-populated or manually overridden
* delete row

When food is selected from Foods DB:

* use serving nutrition and multiply by amount

---

## 2. Foods DB Page

A searchable food database page.

### Features

* search foods by name
* add custom foods
* edit foods
* delete custom foods
* columns:

  * name
  * serving size
  * calories
  * carbs
  * protein
  * fat
* import starter foods seed data

### Important

User should be able to create foods like:

* Raw Salmon
* Siggi's yogurt 0%
* Milk 0%
* Almond Butter
* Rice Cakes
* White Rice cooked
* Apple medium
* Avocado
* Lettuce
* Granola
* Psyllium Husk Powder
  etc.

---

## 3. Reports Page

Basic first version:

* daily calories for last 7 / 30 days
* average protein/carbs/fat
* streak of logged days
* table of recent days
* optional simple charts

---

## 4. Settings Page

* default calorie goal
* default protein target
* default fat target
* default carb target
* preferred number of meals
* theme
* export/import data

---

# UX Requirements

Tell Codex to make the app feel like a nutrition spreadsheet, not a social app.

## UX principles

* fast data entry
* minimal clicks
* keyboard-friendly
* clear totals
* practical desktop-first design
* responsive enough for tablet/mobile

## Nice details

* autofocus next row when adding
* Enter key moves to next cell
* autocomplete dropdown for food names
* sticky totals on desktop
* highlight when targets are exceeded or under target
* save automatically after edits

---

# Non-Functional Requirements

* TypeScript everywhere
* schema validation for API input
* clean component structure
* reusable calculation utilities
* optimistic UI where reasonable
* unit tests for calculations
* seed script for sample foods
* Docker support if possible
* simple README for running locally

---

# Folder Structure Suggestion

```text
/apps
  /web
    /src
      /app or /pages
      /components
        /diary
        /foods
        /reports
        /settings
        /ui
      /lib
        calculations.ts
        formatters.ts
        diary.ts
      /server
        db.ts
        auth.ts
      /types
      /hooks
      /styles
/prisma
  schema.prisma
/scripts
  seed-foods.ts
```

---

# Components To Ask Codex To Build

## Diary components

* `DiaryPage`
* `DateNavigator`
* `MacroSummaryPanel`
* `MacroStatCard`
* `MealCard`
* `MealTable`
* `MealRow`
* `MealTotalsRow`
* `MealActions`

## Foods DB components

* `FoodsPage`
* `FoodsTable`
* `FoodFormDialog`
* `FoodSearchBar`

## Reports components

* `ReportsPage`
* `DailyCaloriesChart`
* `MacroTrendChart`
* `RecentDaysTable`

---

# API Endpoints

If building with REST, create endpoints like:

## Auth

* `POST /api/auth/login`
* `POST /api/auth/logout`
* `POST /api/auth/register`

## Diary

* `GET /api/diary?date=YYYY-MM-DD`
* `PUT /api/diary/:dayId/targets`
* `POST /api/meals/:mealId/entries`
* `PUT /api/entries/:entryId`
* `DELETE /api/entries/:entryId`
* `POST /api/meals/:mealId/copy`
* `POST /api/meals/:mealId/paste`
* `POST /api/meals/:mealId/clear`

## Foods

* `GET /api/foods?query=salmon`
* `POST /api/foods`
* `PUT /api/foods/:foodId`
* `DELETE /api/foods/:foodId`

## Reports

* `GET /api/reports/summary?range=30d`
* `GET /api/reports/daily-calories?range=30d`

---

# Important Product Decisions

Tell Codex to make these explicit.

## 1. Store calculated values or derive them?

Recommended:

* store row nutrition values at time of entry
* derive meal/day totals on read

Why:

* preserves historical accuracy if Food DB changes later

## 2. Allow manual row override?

Yes.

* user may type a custom food row without linking to Food DB

## 3. Support multilingual food names?

Yes.

* store food names as UTF-8 strings
* app must support English and Hebrew food names

## 4. Should meals always exist?

Yes for MVP.

* auto-create 6 empty meals when a new DiaryDay is created

---

# Seed Data

Codex should include seed data so the app looks useful immediately.
Seed about 20–30 foods with realistic values such as:

* Psyllium Husk Powder
* Honey teaspoon
* Rice Cakes Brown Rice
* Turkey Salami
* Milk 0%
* Kind PB Granola
* Bread Flour
* Siggi's yogurt 0%
* White Cheese
* Smoked Salmon
* Apple
* Almond Butter
* Raw Salmon
* White Rice Cooked
* Avocado
* Lettuce
* Pro feel yogurt

---

# Acceptance Criteria

The MVP is complete when:

1. User can open the diary for a date.
2. User sees 6 meals.
3. User can add foods to each meal.
4. User can search/select foods from Foods DB.
5. User can enter custom foods manually.
6. Meal totals update immediately.
7. Daily totals and macro percentages update immediately.
8. User can copy one meal and paste it into another.
9. User can clear a meal.
10. User can change macro targets for the day.
11. Data persists after refresh.
12. Foods DB supports CRUD.
13. Reports page shows at least basic historical summary.

---

# Prompt To Give Codex

Use this as the actual build prompt:

```text
Build a nutrition diary web app similar to a spreadsheet-style food tracker.

Requirements:
- React/TypeScript app
- clean MVP with strong architecture
- pages: Food Diary, Foods DB, Reports, Settings
- Food Diary must support day-based navigation and 6 meals per day
- each meal contains editable food rows with columns for item, amount, calories, carbs, protein, fat
- live meal totals and day totals
- daily macro summary panel with protein/fat/carb grams, calories, percentages, and calorie goal comparison
- support copy/paste/clear meal
- foods database with CRUD and search
- support custom foods and multilingual names including Hebrew
- persist data in SQLite or Postgres using Prisma
- use reusable calculation utilities and TypeScript types
- seed starter foods
- include clean UI and responsive layout
- write a README with setup instructions
- include unit tests for nutrition calculations

Implementation approach:
1. create schema and seed data
2. build backend/API
3. build Food Diary UI first
4. add Foods DB
5. add Reports and Settings
6. make keyboard-friendly UX improvements

Output:
- complete project structure
- runnable local app
- migration files
- seed script
- README
- brief architecture notes
```

---

# Extra Request For Codex

Also tell Codex:

```text
Before coding, write:
1. a short architecture plan
2. the database schema
3. the component tree for the diary page
4. the API contract
Then implement in small commits / logical steps.
Do not over-engineer the first version.
Focus on a working MVP that matches the existing nutrition diary workflow.
```

---

# Nice Future Enhancements

Not required for MVP, but design for them:

* barcode scanning
* photo-based food logging
* recurring meal templates
* AI meal suggestions
* grocery planning
* workout integration
* fiber / micronutrients tracking
* supplement tracking
* fasting windows
* mobile app version

---

# Additional Product Direction (Added Requirements)

## Reference Application

Codex should examine the reference implementation:

[https://nutri-stats.baseecli.com/diary.html](https://nutri-stats.baseecli.com/diary.html)

Login credentials for inspection:

* user: `test@test.com`
* password: `tT1234567`

Review **all pages and links** in that site:

* Diary
* Reports
* Foods DB
* Settings
* Documentation

The goal is to reproduce the **complete functionality** while modernizing the architecture and user experience.

---

# Platform Requirements

The new product must be a **cross‑platform mobile-first application**.

Use:

* **React Native** (primary framework)
* **Expo** recommended for faster cross-platform builds

The app must run on:

* iOS
* Android
* Web (via React Native Web)

This ensures one shared codebase across all platforms.

---

# Additional Core Features

Beyond replicating the NutriStats functionality, add the following capabilities.

## 1. Barcode and QR Food Scanning

Allow users to scan food items using the device camera.

Features:

* barcode scanning
* QR code scanning
* lookup food in external nutrition APIs

Possible APIs:

* OpenFoodFacts
* USDA FoodData Central
* Edamam

Workflow:

1. User taps "Scan Food"
2. Camera opens
3. Barcode detected
4. Food database lookup
5. User confirms portion
6. Food automatically added to meal

---

## 2. Voice Logging of Meals

Allow users to log meals by speaking.

Example:

"I ate two eggs, a slice of bread, and a yogurt"

AI parses the sentence and converts it into food entries.

Possible implementation:

* Speech-to-text (Whisper or native APIs)
* LLM food parsing

---

# New Screen: Steroid Use Analyzer

Add a **health monitoring screen** designed for tracking voice changes over time.

Purpose:

Some users who use anabolic steroids experience **voice changes**.

This tool helps monitor those changes.

### Features

User can:

* record voice samples periodically
* store recordings
* compare voice characteristics over time

### AI Analysis

AI should analyze:

* pitch changes
* tone changes
* vocal roughness
* speech frequency patterns

Possible libraries:

* TensorFlow voice analysis
* PyTorch audio models
* open-source pitch detection

### Output

Provide insights such as:

* trend analysis
* warnings about large deviations
* vocal health indicators

### Privacy

Voice data must be encrypted and user-controlled.

---

# New Feature: AI Workout Planner

Add a **Workout Planner module** inspired by apps like Fitbod.

Important:

Do **NOT copy Fitbod branding or UX**.

Instead build a similar **category of product** with original design.

### Core Idea

An AI-driven fitness coach that:

* generates workout plans
* adapts workouts based on performance
* tracks recovery
* adjusts volume and intensity

### Inputs

User profile:

* age
* gender
* height
* weight
* experience level
* available equipment
* injuries
* goals (strength, hypertrophy, fat loss)

### Data Tracked

* completed exercises
* weights
* sets and reps
* rest times
* fatigue

### AI Adaptation

The system should:

* track muscle group recovery
* avoid overtraining
* progressively increase load

### Example Workflow

User opens workout tab:

App generates today’s plan.

User performs exercises and logs:

* sets
* reps
* weight

AI updates future workouts.

---

# Product Concept

The product should become an **AI‑driven fitness and nutrition platform**.

Core pillars:

1. Nutrition tracking
2. Workout generation
3. Recovery tracking
4. Health analytics

---

# Monetization Strategy

Codex should design the product with monetization in mind.

Possible tiers:

### Free Tier

* nutrition diary
* food scanning
* limited reports

### Pro Tier

* AI workout plans
* advanced analytics
* voice logging
* recovery tracking

### Premium Tier

* steroid analyzer
* advanced health insights
* coaching AI

Subscription model:

$8–$15 per month.

---

# Demand Validation

Codex should include a short validation analysis:

* popularity of fitness apps
* growth of AI coaching tools
* demand for personalized nutrition

Markets to reference:

* MyFitnessPal
* Fitbod
* Strong
* MacroFactor

Explain how this product differentiates.

---

# Sales and Marketing

Codex should propose a go‑to‑market strategy.

Channels:

* TikTok fitness creators
* YouTube fitness content
* Reddit fitness communities
* App Store search optimization

Growth loops:

* shareable progress reports
* social proof
* referral rewards

---

# MVP Build Plan

The MVP should focus on:

1. Nutrition diary
2. Food scanning
3. Basic workout generator
4. Reports

Leave advanced AI features for later iterations.

---

# Final Instruction To Codex

```text
Recreate the core experience of a practical nutrition diary app used daily by a serious user who wants speed, precision, and clear macro tracking. Prioritize usability and correctness over flashy design.
```
