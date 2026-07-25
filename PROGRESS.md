# KavrioLab Active Development Progress

This file serves as the live progress record. If the session idle-times out, crashes, or is handed over, read this file to determine the exact state of progress.

---

## 1. Active Status Summary
- **Current Phase:** Phase 3: Nutrition & Scanner Pipelines (`IN PROGRESS` 🚀)
- **Active Milestone:** `M13: Daily Nutrition Tracker Dashboard` — NEXT UP
- **Last Action Completed:** Completed M12: Food Search & Multi-Source API Integration (`src/app/api/nutrition/foods/route.ts` & `/nutrition`). Built unified search with full pagination (`page`, `pageSize`), OpenFoodFacts routing (`v3` for barcodes, `v1 search.pl` for full-text search, `v2` with `sort_by=unique_scans_n` for popular browsing), and USDA FoodData Central API integration (`SR Legacy`, `Foundation`, `Branded`). Added source filter tabs (`All`, `Local`, `OpenFoodFacts`, `USDA FoodData`) and badges with bilingual EN/VI translations (`dictionaries.ts`).
- **Next Step (RESUME HERE):** Continue Phase 3 — M13: Daily Nutrition Tracker Dashboard (building `/nutrition/daily` or daily logging panels to log foods into `DailyNutritionLog` and `MealLog` with dynamic macro progress rings against user TDEE targets).


---

## 2. Milestone Checklist

### Phase 1: Foundation & Setup ✅ COMPLETE
- [x] **M01:** Repository Scaffolding & Configs
- [x] **M02:** Schema Migration & Prisma Scaffolding
- [x] **M03:** Authentication Logic & Session Middleware
- [x] **M04:** Dynamic Onboarding Form
- [x] **M05:** Global Navigation & Dashboard Skeleton

---

### Phase 2: Core Workout Logic ✅ COMPLETE

#### M06: Exercise Library Database ✅ COMPLETE
- [x] Extended `prisma/schema.prisma` with `Exercise`, `WorkoutLog`, `WorkoutLogExercise`, `WorkoutLogSet`, `WorkoutTemplate`, `WorkoutTemplateExercise`, `WorkoutTemplateSet` models
- [x] Added enums: `SetType`, `ExerciseCategory`, `MuscleGroup`, `Equipment`
- [x] Ran `npx prisma db push` — DB is in sync
- [x] Ran `npx prisma generate` — Client regenerated
- [x] Created `prisma/seed-exercises.ts` — 138 exercises across all muscle groups, equipment types and variations
- [x] Ran seed script — `✅ Done: 138 created`

#### M07: Live Workout Logger ✅ COMPLETE
- [x] `src/lib/validations/workoutSchemas.ts` — Zod schemas for sets, workout logs, templates
- [x] `src/lib/stores/useWorkoutStore.ts` — Zustand + Immer store for active session state
- [x] `src/app/api/exercises/route.ts` — GET search API with name/category filter
- [x] `src/app/api/workouts/route.ts` — POST (save session) + GET (list)
- [x] `src/app/api/workouts/history/route.ts` — Paginated history API
- [x] `src/app/api/workout-templates/route.ts` — GET list + POST create templates
- [x] `src/components/workout/ExercisePickerDrawer.tsx` — Slide-up drawer with debounced search
- [x] `src/components/workout/SetLogRow.tsx` — Inline set editor with rest timer trigger
- [x] `src/app/(dashboard)/workouts/active/page.tsx` — Live workout logger UI
- [x] `src/app/(dashboard)/workouts/active/loading.tsx` — Skeleton loader
- [x] `src/app/(dashboard)/workouts/active/error.tsx` — Error boundary
- [x] `src/app/(dashboard)/workouts/page.tsx` — Overview page with Start/Templates/History cards
- [x] `src/app/(dashboard)/workouts/history/page.tsx` — History list grouped by week
- [x] `src/app/(dashboard)/workouts/history/loading.tsx` — Skeleton loader
- [x] `src/app/(dashboard)/workouts/history/[id]/page.tsx` — Full session detail view
- [x] `src/app/(dashboard)/workouts/history/error.tsx` — Error boundary
- [x] `src/app/(dashboard)/workouts/templates/page.tsx` — Template library grid
- [x] `src/app/(dashboard)/workouts/templates/[id]/page.tsx` — Template detail editor
- [x] `src/app/(dashboard)/workouts/templates/loading.tsx` + `error.tsx`
- [x] Update sidebar navigation links to include Workouts, Templates, History

#### M08: Rest Timer Component ✅ COMPLETE
- [x] `src/lib/hooks/useRestTimer.ts` — countdown hook with start/reset/skip + progress ratio
- [x] `src/components/workout/RestTimerOverlay.tsx` — animated SVG ring overlay, auto-start variant

#### M09: Program & Routine Builder ✅ COMPLETE
- [x] DB schema for `WorkoutTemplate` ✅ (already added in M06 schema)
- [x] API for templates ✅ (already created above)
- [x] Templates list & editor UI ✅ (already created above)
- [x] `prisma/schema.prisma` — Added `WorkoutSchedule` model (userId, dayOfWeek 0-6, templateId, unique constraint per user/day)
- [x] `src/app/api/workout-schedule/route.ts` — GET/POST/DELETE REST API for weekly schedule assignments
- [x] `src/app/(dashboard)/workouts/schedule/page.tsx` — 7-day grid, template picker modal, today highlight, start-workout shortcut
- [x] `src/app/(dashboard)/workouts/schedule/loading.tsx` — Skeleton loader
- [x] `src/app/(dashboard)/workouts/schedule/error.tsx` — Error boundary
- [x] `src/components/shared/sidebar.tsx` — Added Schedule nav item (CalendarDays icon)
- [x] `src/lib/translations/dictionaries.ts` — Added `schedule` key group (en + vi)

#### M10: Plate Calculator Utility ✅ COMPLETE
- [x] `src/lib/hooks/usePlateCalculator.ts` — greedy plate allocation algorithm
- [x] `src/components/workout/PlateCalculatorWidget.tsx` — visual barbell diagram
- [x] Integrated into `SetLogRow.tsx` for barbell exercises

#### M11: History & Log Archive ✅ COMPLETE
- [x] `src/app/api/workouts/history/route.ts` — paginated API
- [x] `src/app/(dashboard)/workouts/history/page.tsx` — list view grouped by week
- [x] `src/app/(dashboard)/workouts/history/[id]/page.tsx` — session detail view
- [x] `src/app/(dashboard)/workouts/history/error.tsx` — Error boundary for history logs

---

### Phase 3: Nutrition & Scanner Pipelines (`IN PROGRESS` 🚀)

#### M12: Food Search & Multi-Source API Integration ✅ COMPLETE
- [x] DB Schema for `FoodItem`, `DailyNutritionLog`, `MealLog`, and `MealFoodItem` models (`schema.prisma`)
- [x] `prisma/seed-foods.ts` — Seeded 45 verified staple and Vietnamese foods (`Cơm gà xối mỡ`, `Phở bò`, `Whey Isolate`, etc.)
- [x] `src/app/api/nutrition/foods/route.ts` — Unified search API supporting:
  - **Local DB Verified & Custom Foods** (`source=local` or `source=all`)
  - **OpenFoodFacts Global Database** (`source=off` or `source=all`):
    - **API v3** (`/api/v3/product/{barcode}.json`) for exact barcode scanning/lookup
    - **API v1 (`cgi/search.pl`)** for exact full-text search (`search_terms`) conforming to official OpenFoodFacts specs
    - **API v2 (`/api/v2/search`)** with `sort_by=unique_scans_n` for browsing popular products with 0-calorie/macro handling
  - **USDA FoodData Central API** (`source=usda` or `source=all`) via `api.nal.usda.gov` querying `SR Legacy`, `Foundation`, and `Branded` datasets
  - **Pagination Engine** (`page`, `pageSize`, `totalCount`, `totalPages`)
- [x] `src/app/(dashboard)/nutrition/page.tsx` — Dynamic Food Search & Library Dashboard:
  - Source filter tabs (`All Sources`, `Local Verified`, `OpenFoodFacts`, `USDA FoodData API`)
  - Pagination controls (`Previous/Next` buttons, page counter, smooth window scroll)
  - Source badges (`Local Verified`, `OpenFoodFacts`, `USDA FoodData Central`, `Custom (Personal)`)
  - Interactive popup detail modal and custom food creation modal
- [x] `src/lib/translations/dictionaries.ts` — Complete bilingual translations (EN/VI) for nutrition search, filters, badges, and pagination

#### M13: Daily Nutrition Tracker Dashboard — IN PROGRESS / NEXT UP
- [ ] Create daily nutrition logging dashboard (`/nutrition/daily` or dashboard widgets)
- [ ] Visual rings detailing logged calories, carbs, fat, and protein vs target TDEE
- [ ] Quick log meal functionality (Breakfast, Lunch, Dinner, Snacks)

#### M14: Web Barcode Scanner — PENDING
- [ ] Decode barcodes using device camera (`@zxing/library` decoders)
- [ ] Connect barcode scanner directly to OpenFoodFacts v3 barcode lookup

#### M15: Custom Foods & Recipes Creator — PENDING
- [ ] Recipe calculation schema grouping ingredients
- [ ] Custom recipe builder modal & forms

#### M16: Shopping List & Meal Plan Builder — PENDING
- [ ] Weekly meal planner templates & shopping aggregators

#### M17: Offline Nutrition Sync Pipeline — PENDING
- [ ] Service worker / IndexedDB offline mutation queue and sync engine

---

## 3. New Files Created in Phase 2 & Phase 3

| File | Status |
|---|---|
| `prisma/schema.prisma` | ✅ Updated with Phase 2 & Phase 3 models |
| `prisma/seed-exercises.ts` | ✅ 138 exercises seeded |
| `prisma/seed-foods.ts` | ✅ 45 verified foods seeded |

| `src/lib/validations/workoutSchemas.ts` | ✅ Complete |
| `src/lib/stores/useWorkoutStore.ts` | ✅ Complete |
| `src/lib/hooks/useRestTimer.ts` | ✅ Complete |
| `src/lib/hooks/usePlateCalculator.ts` | ✅ Complete |
| `src/lib/utils.ts` | ✅ Added cn() helper |
| `src/components/ui/skeleton.tsx` | ✅ Added Skeleton component |
| `src/components/workout/RestTimerOverlay.tsx` | ✅ Complete |
| `src/components/workout/PlateCalculatorWidget.tsx` | ✅ Complete |
| `src/components/workout/ExercisePickerDrawer.tsx` | ✅ Complete |
| `src/components/workout/SetLogRow.tsx` | ✅ Complete |
| `src/app/api/exercises/route.ts` | ✅ Complete |
| `src/app/api/workouts/route.ts` | ✅ Complete |
| `src/app/api/workouts/history/route.ts` | ✅ Complete |
| `src/app/api/workout-templates/route.ts` | ✅ Complete |
| `src/app/(dashboard)/workouts/page.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/active/page.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/active/loading.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/active/error.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/history/page.tsx` | ✅ Complete (type issues) |
| `src/app/api/workout-schedule/route.ts` | ✅ Complete (GET/POST/DELETE) |
| `src/app/(dashboard)/workouts/schedule/page.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/schedule/loading.tsx` | ✅ Complete |
| `src/app/(dashboard)/workouts/schedule/error.tsx` | ✅ Complete |

---

## 4. Environment Verification State
- **TypeScript Compilation:** ✅ COMPLETE (Build finishes with 0 errors)
- **Database Schema:** ✅ Synced (all new tables created via `db push`)
- **Exercise Seed:** ✅ 138 exercises in DB
- **Sanity Test Suite:** ✅ Passing
- **Database Connection:** ✅ Connected (PostgreSQL local unix socket)
- **Theme Support:** ✅ Configured (Context-based Light/Dark switching)

---

## 5. Development Credentials
- **Email:** `developer@kavriolab.com`
- **Password:** `AdminPassword123!`
- **Role:** `ADMIN`

---

## 6. Known Issues & Root Causes

### Issue: `prisma.exercise` / `prisma.workoutLog` not found by TypeScript
**Root Cause:** `src/lib/prisma.ts` uses the `PrismaPg` driver adapter (`new PrismaClient({ adapter })`). In Prisma 7.x with driver adapters, the TypeScript type for `PrismaClient` when constructed with an adapter differs from the base type, causing all model properties to appear missing to TS (even though they work at runtime).

**Fix:** On resume, try either:
1. Cast the prisma export: `export const prisma = prismaInstance as PrismaClient;` (without adapter type param)
2. Or update to use `$extends()` pattern if adapter types are separate in Prisma 7.x
3. Check Prisma 7 release notes for driver adapter TypeScript changes

### Issue: Zod deprecation warnings for `.uuid()`, `.datetime()`
**Root Cause:** Zod v4 changed these API signatures. Warnings only — not blocking. Fix later by migrating to Zod v4 syntax.
