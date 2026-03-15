# Atlas Fitness OS MVP

Cross-platform Expo MVP for a broader fitness product with a better nutrition-planning UX. The app is local-first, uses SQLite on native and `localStorage` on web, and targets iOS, Android, and web from a shared React Native codebase.

## Included MVP

- Home dashboard
- Nutrition planner with quick-add meal flow
- Barcode-linked foods and scanner-ready nutrition entry
- Workout page with subscription-gated premium modules
- Foods database with CRUD and starter seed data
- Reports for recent intake and logging streaks
- Settings for defaults, meal count, theme, and subscription tier
- Local auth stub using the provided demo account
- Unit tests for calculation utilities

## Stack

- Expo + React Native + TypeScript
- `expo-sqlite` for local persistence
- Custom component layer tuned for spreadsheet-like data entry

## Run

```bash
npm install
npm run web
```

For native:

```bash
npm run ios
npm run android
```

## Demo Login

- Email: `test@test.com`
- Password: `tT1234567`

## Scripts

- `npm run typecheck`
- `npm run test`

## Notes

- The reference site was not reachable from this environment, so the implementation follows the provided PRD plus the later UX direction from this thread.
- Live camera scanning is wired as an optional path. Install `expo-camera` with `npx expo install expo-camera` if you want the scanner view instead of manual barcode entry only.
- There is still no real backend server in this MVP. The app currently runs local-first, with a local user catalog, a seeded shared catalog layer inside the app, and external fallback via OpenFoodFacts for missing searches/barcodes.
