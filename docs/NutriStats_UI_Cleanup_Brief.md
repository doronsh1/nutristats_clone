# NutriStats UI Cleanup Brief for Codex

## Context

This app is intended to be a **phone-first nutrition and fitness app**, but the current UI feels cluttered, text-heavy, and hard to understand.

A core failure right now is **discoverability**:

- even a user who already knows the app does not immediately understand how to log food
- there is too much text on screen
- actions do not stand out enough
- the information hierarchy is weak
- the experience does not feel like a mobile app

Your job is **not** to add more features first.
Your job is to **clean up the existing experience** so it becomes usable, obvious, and calm.

## Primary Goal

Redesign the current app into a **simple, mobile-first experience** where the user can do the most important task quickly:

1. open app
2. understand where they are
3. tap one obvious action
4. log food in seconds

The product should feel closer to a modern phone app and less like a dense internal tool.

---

## Top UX Problems to Solve

### 1. Too much text
Reduce instructional and descriptive text across the app.

Rules:
- prefer labels over paragraphs
- prefer icons + short labels over long explanations
- no large blocks of helper text unless absolutely necessary
- keep card content brief and scannable
- assume the user is on a small phone screen

### 2. Primary actions are unclear
The user should never wonder:
- where do I log food?
- what do I tap next?
- what screen is most important today?

There must be one obvious primary action on the home/diary flow.

### 3. Weak visual hierarchy
The most important elements should stand out immediately:
- today's calories/macros
- add food
- diary/meals
- recent foods
- scan/search/manual entry

### 4. Too much information competing at once
Do not show everything equally.
Group content into clear sections and hide secondary detail behind drill-down screens, accordions, or modals.

### 5. Not designed like a phone app
Current UI should be reworked for:
- one-hand use
- large tap targets
- bottom navigation
- limited vertical overload
- strong spacing
- cards and sections instead of dense text lists

---

## Product Direction

Build the UI around these core jobs:

### Core job 1: Log food fast
This is the highest priority.

The user should be able to do this from the main screen in **one tap**.

### Core job 2: See daily progress quickly
At a glance, the user should understand:
- calories consumed vs target
- protein consumed vs target
- meals logged today
- what remains for the day

### Core job 3: Reuse common foods
Make repeat logging easy:
- recent foods
- favorite foods
- repeat last meal
- saved meals

### Core job 4: Keep the experience calm
The app should feel organized and lightweight, not overwhelming.

---

## Required Structural Changes

## 1. Introduce a simple bottom navigation
Replace messy or unclear navigation with a small set of phone-first tabs.

Use 4–5 tabs max:

- Home
- Diary
- Add
- Progress
- Profile

Alternative:
- Home
- Log
- Progress
- Foods
- Profile

Rules:
- short labels only
- recognizable icons
- active tab must be visually obvious
- no text-heavy menus as the primary navigation

## 2. Add a floating or sticky primary CTA
There must be an always-obvious way to log food.

Examples:
- floating `+ Add Food` button
- sticky bottom CTA on diary screen
- dedicated center tab for Add

This CTA should open a clean add-food flow.

## 3. Create a focused Add Food flow
The add-food experience should present a small number of choices only.

Recommended entry screen:

- Search food
- Scan barcode
- Recent foods
- Saved meals
- Manual entry

Do **not** dump the user into a dense screen full of text and options.

## 4. Turn the main screen into a dashboard, not a wall of content
The home screen should answer only:
- how am I doing today?
- what should I do next?

Recommended home layout:

### Header
- greeting or `Today`
- current date

### Daily summary card
- calories: consumed / target
- protein: consumed / target
- maybe carbs/fat in a secondary row

### Primary CTA
- `Add Food`

### Meals today
- Breakfast
- Lunch
- Dinner
- Snacks

Each meal card should show:
- meal name
- calories
- protein
- number of items
- quick add button

### Secondary section
- recent foods or repeat last meal

That is enough for v1 cleanup.

---

## Visual Design Direction

## Overall style
The app should feel:
- modern
- clean
- spacious
- confident
- mobile-native

Avoid:
- long text blocks
- tiny links
- crowded forms
- overly technical language
- tables unless absolutely needed

## Layout rules
- generous padding
- clear section spacing
- strong card hierarchy
- large touch targets
- consistent corner radius
- consistent icon usage

## Typography rules
- fewer font sizes
- stronger hierarchy
- no paragraphs where a 1-line label works
- use short titles and muted secondary text

Suggested type scale:
- screen title
- section title
- card title
- body
- caption

## Button rules
Primary buttons must be obvious.
Use only a few button styles:
- primary filled
- secondary outline/tonal
- ghost/icon button

Do not mix many random styles.

## Color rules
Use a restrained palette.
Likely best direction:
- neutral background
- elevated cards
- one strong accent color
- success/goal colors used sparingly

Focus on readability over decoration.

---

## Specific UI Requirements by Screen

## Home / Today

### Goals
- immediate clarity
- obvious food logging action
- lightweight summary

### Must include
- today's calorie progress
- protein progress
- meals list
- add food CTA

### Should remove or reduce
- long explanatory text
- too many widgets
- nonessential stats above the fold

### Desired layout
1. Header
2. Daily macro summary card
3. Primary `Add Food` CTA
4. Meals list
5. Recent/favorite foods

---

## Diary Screen

### Goals
- make meal logging and review easy
- reduce noise

### Must include
- meal sections
- item rows that are easy to scan
- edit/delete controls that are simple
- subtotal per meal

### Row design for each food item
Each logged item row should show only the essentials:
- food name
- serving summary
- calories
- protein

Secondary details can be hidden or de-emphasized.

### Interactions
- tap row to edit
- swipe or icon for delete
- quick add to a meal

---

## Add Food Screen

This is one of the most important screens.

### The first screen should be choice-based, not clutter-based
Show large tiles/buttons for:
- Search
- Scan
- Recent
- Favorites
- Saved Meals
- Manual

### Search behavior
Food search screen should include:
- large search input
- recent searches
- fast result list
- clear food rows

### Result row should show
- food name
- brand if available
- serving hint
- calories
- protein if available

Do not overload each row with too much metadata.

---

## Progress Screen

### Goal
Show progress simply.

### Must include
- calories trend
- protein consistency
- weight trend if available
- streak or adherence metric

### Rules
- use cards/charts with short titles
- one main insight per card
- avoid dashboards full of dense numbers

---

## Foods / Library / Saved

If the app already has food database or saved items, simplify it.

### Priority content
- Recent
- Favorites
- Saved meals
- Custom foods

Make it easy to reuse common entries.

---

## Profile / Settings

Move secondary controls here.
Do not clutter the main flow with settings.

Can include:
- calorie target
- macro targets
- body stats
- preferences
- units
- account settings

---

## Information Architecture Rules

Use this priority order across the app:

### Tier 1: Must be instantly visible
- Add Food
- today's calories
- today's protein
- meals

### Tier 2: Useful but secondary
- carbs/fat
- recent foods
- favorites
- saved meals

### Tier 3: Should be hidden deeper
- advanced settings
- explanatory copy
- edge-case controls
- admin-like info

If something is not essential to logging food or seeing daily progress, it should not dominate the screen.

---

## Interaction Design Requirements

### Make every action obvious
Use explicit buttons such as:
- Add Food
- Search Food
- Scan Barcode
- Save Meal
- Repeat Meal

Avoid vague text labels.

### Support one-handed mobile use
- important actions near bottom half when possible
- large tap targets
- avoid tiny text links

### Prefer progressive disclosure
Show less first.
Reveal more after tap.

Examples:
- collapse macro details
- expand meal items only when needed
- show advanced nutrition only on detail screen

---

## Component Cleanup Requirements

Codex should create or refactor toward a small reusable component set:

- `AppShellMobile`
- `BottomTabBar`
- `PrimaryCTA`
- `SummaryCard`
- `MacroProgressCard`
- `MealCard`
- `FoodRow`
- `QuickActionGrid`
- `EmptyState`
- `SearchBar`
- `SectionHeader`

Each component should be visually consistent and optimized for phone layout.

---

## Mobile-First Constraints

This app is supposed to be a phone app.
Design every screen for a narrow viewport first.

Rules:
- optimize for common phone widths first
- no desktop-style dense layouts as the default
- limit content above the fold
- no giant forms on one screen
- avoid side-by-side layouts unless truly necessary

Web can adapt later, but phone UX comes first.

---

## Suggested Design Inspiration

Use these for overall direction only, not to copy literally.

### General mobile fitness / nutrition patterns
- Apple Fitness
- MyFitnessPal
- Fitbod
- Cronometer
- Whoop

### Browse visual inspiration here
- Dribbble fitness app results: https://dribbble.com/search/fitness-app
- Dribbble nutrition app results: https://dribbble.com/search/nutrition-app
- Dribbble calorie tracker results: https://dribbble.com/search/calorie-tracker

### What to pay attention to in inspiration
- simple dashboard hierarchy
- strong CTA placement
- card-based sections
- light copy
- obvious add/log flows
- bottom navigation

---

## Implementation Approach

Do this in phases.

### Phase 1: Cleanup without changing backend logic
Focus on structure and presentation only.

Tasks:
1. simplify navigation
2. redesign home/today screen
3. redesign add-food flow
4. redesign diary meal cards and food rows
5. reduce text everywhere
6. improve spacing, buttons, and hierarchy

### Phase 2: Improve repeat logging
Tasks:
1. recent foods
2. favorites
3. repeat meal
4. saved meals

### Phase 3: Progress polish
Tasks:
1. cleaner charts
2. adherence summaries
3. less cluttered insights

---

## Concrete Acceptance Criteria

The redesign is successful if the following are true:

### Food logging clarity
A user opening the app for the first time can tell within 3 seconds how to add food.

### Home clarity
The home screen has one primary action and no wall of text.

### Mobile feel
The app feels like a phone app, not like a crowded web admin panel.

### Scannability
Every major screen can be understood by scanning, not reading paragraphs.

### Reduced clutter
At least 30–50% of nonessential visible text should be removed or condensed.

---

## Deliverables Expected from Codex

1. Refactored navigation for mobile-first UX
2. New Home / Today screen
3. New Add Food flow
4. Cleaner Diary / Meal logging UI
5. Reduced text and improved hierarchy across all current screens
6. Reusable component system for cards, rows, CTAs, and sections
7. Updated styling tokens for spacing, typography, buttons, and cards

---

## Very Important Notes

- Do **not** solve this by adding more explanatory text
- Do **not** keep current structure and only restyle colors
- Do **not** optimize for desktop first
- Do **not** show too many actions on one screen
- prioritize usability over feature density

The main goal is to make the app feel calm, obvious, and usable enough that I can start using it myself every day.
