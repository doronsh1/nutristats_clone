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
- Firebase email/password authentication
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

## Firebase Auth Setup

Copy [`.env.example`](/Users/doronsheinbaum/repos/github/my_apps/nutristat_clone/.env.example) to `.env.local` and fill in your Firebase web app values:

```bash
cp .env.example .env.local
```

Required variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

These are public client-side Firebase config values, not server secrets. They can be exposed in the built app, but it is still better to keep them in environment variables instead of committing a project-specific config to git.

For Cloudflare, add the same `EXPO_PUBLIC_FIREBASE_*` keys in your project environment variables so the Expo web export can embed them at build time.

## Scripts

- `npm run typecheck`
- `npm run test`

## Notes

- The reference site was not reachable from this environment, so the implementation follows the provided PRD plus the later UX direction from this thread.
- Live camera scanning is wired as an optional path. Install `expo-camera` with `npx expo install expo-camera` if you want the scanner view instead of manual barcode entry only.
- There is still no real backend server in this MVP. The app currently runs local-first, with a local user catalog, a seeded shared catalog layer inside the app, and external fallback via OpenFoodFacts for missing searches/barcodes.
- There is still no real shared backend DB in this MVP. Firebase Auth handles identity only; shared foods, review queues, and subscription enforcement still need a backend service.
