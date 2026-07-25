# KavrioLab — Code Navigation Index

> **Purpose for AI agents:** This file is a complete map of the codebase. Read this FIRST before opening any source file. It tells you **what each file does**, **where each feature lives**, and **which files to edit** for any given task. Never scan the raw file tree when this index exists.

**Tech stack:** Next.js 15 App Router · TypeScript · Prisma 7 (PostgreSQL) · Tailwind CSS v4 · Zustand · Framer Motion · Auth.js v5 · Zod

---

## 1. Entry Points & Root Config

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root HTML shell. Wraps with `<Providers>` (theme + session + language). |
| `src/app/globals.css` | Tailwind v4 base styles + custom `@utility scrollbar-none`. |
| `src/app/page.tsx` | Marketing landing page at `/`. Contains TDEE calculator widget. |
| `src/auth.ts` | Auth.js v5 config — credentials provider, session callbacks, user ID injection. |
| `src/auth.config.ts` | Auth.js edge config — middleware route guards. |
| `src/proxy.ts` | Next.js middleware proxy config for Auth.js edge runtime. |
| `prisma/schema.prisma` | Complete DB schema — all models, enums, relations. |
| `prisma/seed-exercises.ts` | Seeds 138 exercises across all muscle groups/equipment. Run with `npx tsx prisma/seed-exercises.ts`. |
| `prisma.config.ts` | Prisma config pointing to `schema.prisma`. |

---

## 2. Layout & Navigation

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Dashboard shell — renders floating sidebar + floating header + main content. |
| `src/components/shared/sidebar.tsx` | Left sidebar nav. 7 items: Dashboard, Workouts, Templates, History, Schedule, Nutrition, Settings. Uses `usePathname` for active state. |
| `src/components/shared/header.tsx` | Floating top header. Dark/light toggle, language switcher (EN/VI). Reads cookie for language. |
| `src/components/shared/PageTransition.tsx` | Framer Motion `opacity + y` page entry wrapper. Wraps every page root. |
| `src/components/providers.tsx` | Combines SessionProvider + ThemeProvider + LanguageProvider. |
| `src/components/theme-provider.tsx` | next-themes wrapper for dark/light mode. |
| `src/components/language-provider.tsx` | React context for i18n. Provides `useTranslation()` → `{ t, language, setLanguage }`. |

---

## 3. Pages

### Auth
| Route | File | Notes |
|-------|------|-------|
| `/login` | `src/app/(auth)/login/page.tsx` | Email/password login. Uses `signIn('credentials', ...)`. |
| `/onboarding` | `src/app/onboarding/page.tsx` | 4-step wizard: gender/birth/unit → height/weight → goal → summary. |

### Dashboard
| Route | File | Notes |
|-------|------|-------|
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Server component. User profile stats (TDEE, macros, biometrics). |

### Workouts
| Route | File | Notes |
|-------|------|-------|
| `/workouts` | `src/app/(dashboard)/workouts/page.tsx` | Hub: Start Workout modal, Templates card, History card. |
| `/workouts/active` | `src/app/(dashboard)/workouts/active/page.tsx` | **Live Workout Logger** — Zustand store driven. SetLogRow per exercise, rest timer, plate calc. |
| `/workouts/templates` | `src/app/(dashboard)/workouts/templates/page.tsx` | Template list grid. Start/Edit/Delete per card. |
| `/workouts/templates/[id]` | `src/app/(dashboard)/workouts/templates/[id]/page.tsx` | **Template Editor** — exercises, sets (type/kg/reps). Uses ExercisePickerDrawer. |
| `/workouts/history` | `src/app/(dashboard)/workouts/history/page.tsx` | Server component. Logs grouped by week. |
| `/workouts/history/[id]` | `src/app/(dashboard)/workouts/history/[id]/page.tsx` | Server component. Full session detail. |
| `/workouts/schedule` | `src/app/(dashboard)/workouts/schedule/page.tsx` | **Weekly Scheduler** — 7-day grid, assign templates to days, today highlight, clear all. |
| `/nutrition` | `src/app/(dashboard)/nutrition/page.tsx` | Placeholder — Phase 3. |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | User settings. |

Each route folder has `loading.tsx` (skeleton) and `error.tsx` (error boundary).

---

## 4. API Routes

| Endpoint | File | Methods | Description |
|----------|------|---------|-------------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | ALL | Auth.js handler. |
| `/api/exercises` | `src/app/api/exercises/route.ts` | GET | Search exercises. Params: `?q=` `?category=`. Max 200. |
| `/api/workouts` | `src/app/api/workouts/route.ts` | GET, POST | GET: list logs. POST: save completed session. |
| `/api/workouts/history` | `src/app/api/workouts/history/route.ts` | GET | Paginated history. |
| `/api/workouts/history/[id]` | `src/app/api/workouts/history/[id]/route.ts` | GET, DELETE | Session detail / delete log. |
| `/api/workout-templates` | `src/app/api/workout-templates/route.ts` | GET, POST | List / create templates. |
| `/api/workout-templates/[id]` | `src/app/api/workout-templates/[id]/route.ts` | GET, PUT, DELETE | CRUD single template. |
| `/api/workout-schedule` | `src/app/api/workout-schedule/route.ts` | GET, POST, DELETE | Schedule slots. DELETE: `?day=N` one day; no param → clear all. |

---

## 5. Workout Feature Components

| Component | File | Purpose |
|-----------|------|---------|
| `ExercisePickerDrawer` | `src/components/workout/ExercisePickerDrawer.tsx` | Centered modal. Debounced search, horizontal category tabs (callback ref for drag scroll), gradient edge fade masks. |
| `SetLogRow` | `src/components/workout/SetLogRow.tsx` | Single set row. Reps + kg inputs, set type selector, checkmark → triggers rest timer. |
| `RestTimerOverlay` | `src/components/workout/RestTimerOverlay.tsx` | Full-screen animated SVG ring countdown. Auto-start on set completion. |
| `PlateCalculatorWidget` | `src/components/workout/PlateCalculatorWidget.tsx` | Barbell plate diagram. Greedy allocation for target weight. |
| `DeleteHistoryButton` | `src/components/workout/DeleteHistoryButton.tsx` | Client button for deleting workout log (used in server history detail page). |

---

## 6. State Management

### Zustand Store
| Store | File | What it holds |
|-------|------|--------------|
| `useWorkoutStore` | `src/lib/stores/useWorkoutStore.ts` | Active session: `isActive`, `sessionName`, `startedAt`, `exercises[]` with `sets[]`. Actions: `startWorkout`, `startWorkoutFromTemplate`, `addExercise`, `removeExercise`, `addSet`, `updateSet`, `removeSet`, `finishWorkout`, `cancelWorkout`. |

### Custom Hooks
| Hook | File | Returns |
|------|------|---------|
| `useRestTimer` | `src/lib/hooks/useRestTimer.ts` | `{ timeLeft, isRunning, progress, start, reset, skip }` |
| `usePlateCalculator` | `src/lib/hooks/usePlateCalculator.ts` | `{ plates[], totalKg }` — greedy plate allocation |

---

## 7. Data & Validation

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Singleton `prisma` client with PrismaPg driver adapter (Pool from `pg`). ⚠️ TS lint shows "property does not exist" for new models — known adapter type quirk, works at runtime. |
| `src/lib/utils.ts` | `cn()` — `clsx` + `tailwind-merge` class merger. |
| `src/lib/calculations.ts` | BMR (Mifflin-St Jeor) + TDEE. Used in onboarding step 4. |
| `src/lib/validations/workoutSchemas.ts` | Zod: `CreateWorkoutLogSchema`, `WorkoutLogSetSchema`, `CreateTemplateSchema`. |
| `src/lib/validations/onboarding.ts` | Zod: onboarding multi-step form schema. |
| `src/app/actions/onboarding.ts` | Server Action: writes onboarding data → `UserProfile`. |

---

## 8. Internationalization (i18n)

**Single file:** `src/lib/translations/dictionaries.ts`

Two locale objects: `en` and `vi`. Access in client via `useTranslation()` → `t('group.key')`.
Access in server via `dictionaries[lang].group.key`.

| Key Group | Used in |
|-----------|---------|
| `common.*` | App-wide labels |
| `sidebar.*` | `sidebar.tsx` nav |
| `landing.*` | `/` marketing page |
| `login.*` | Login page |
| `onboarding.*` | Onboarding wizard |
| `dashboard.*` | Dashboard page |
| `workouts.*` | All workout pages + components |
| `workouts.categories.*` | ExercisePickerDrawer tabs |
| `workouts.scheduleDays.*` | Schedule page (keyed 0–6) |

**To add text:** add key to BOTH `en.X` and `vi.X` groups. Access via `t('X.key')`.

---

## 9. Database Schema Quick Reference

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `User` | `id`, `email`, `passwordHash`, `role` | → UserProfile, WorkoutLog[], WorkoutTemplate[], WorkoutSchedule[] |
| `UserProfile` | `userId`, `gender`, `heightCm`, `targetWeightKg`, `activityTier`, `unitSystem` | → User |
| `Exercise` | `name`, `slug`, `category`, `primaryMuscle`, `equipment`, `isCustom` | → WorkoutLogExercise[], WorkoutTemplateExercise[] |
| `WorkoutLog` | `userId`, `name`, `startedAt`, `completedAt`, `notes` | → WorkoutLogExercise[] |
| `WorkoutLogExercise` | `workoutLogId`, `exerciseId`, `orderIndex` | → WorkoutLogSet[] |
| `WorkoutLogSet` | `setType`, `weightKg`, `repsCompleted`, `rpe`, `completed` | — |
| `WorkoutTemplate` | `userId`, `name`, `description` | → WorkoutTemplateExercise[], WorkoutSchedule[] |
| `WorkoutTemplateExercise` | `templateId`, `exerciseId`, `orderIndex` | → WorkoutTemplateSet[] |
| `WorkoutTemplateSet` | `setType`, `targetWeightKg`, `targetReps`, `orderIndex` | — |
| `WorkoutSchedule` | `userId`, `dayOfWeek` (0=Mon..6=Sun), `templateId` | Unique: `[userId, dayOfWeek]` |

### Enums
| Enum | Values |
|------|--------|
| `ExerciseCategory` | CHEST, BACK, SHOULDERS, BICEPS, TRICEPS, LEGS, GLUTES, CORE, CARDIO, FULL_BODY, OTHER |
| `MuscleGroup` | CHEST, LATS, UPPER_BACK, LOWER_BACK, TRAPS, SHOULDERS, BICEPS, TRICEPS, QUADS, HAMSTRINGS, CALVES, GLUTES, ABS, OBLIQUES, OTHER |
| `Equipment` | BARBELL, DUMBBELL, KETTLEBELL, MACHINE, CABLE, RESISTANCE_BAND, BODYWEIGHT, OTHER |
| `SetType` | NORMAL, WARMUP, DROP, FAILURE |
| `UnitSystem` | METRIC, IMPERIAL |
| `Role` | USER, ADMIN |

---

## 10. Feature → File Quick Lookup

| Task | Files to Edit |
|------|--------------|
| Add new sidebar nav link | `sidebar.tsx` + `dictionaries.ts` (sidebar key) |
| Add new API endpoint | `src/app/api/<name>/route.ts` |
| Add new page | `(dashboard)/<route>/page.tsx` + `loading.tsx` + `error.tsx` |
| Add new exercise category | `schema.prisma` (enum) + `seed-exercises.ts` + `ExercisePickerDrawer.tsx` (CATEGORIES array) |
| Add new translation | `dictionaries.ts` → both `en` and `vi` |
| Modify active session state | `useWorkoutStore.ts` |
| Modify rest timer | `useRestTimer.ts` + `RestTimerOverlay.tsx` |
| Modify plate calculator | `usePlateCalculator.ts` + `PlateCalculatorWidget.tsx` |
| Add new DB model | `schema.prisma` → `npx prisma db push` → `npx prisma generate` |
| Change dashboard layout | `(dashboard)/layout.tsx` + `sidebar.tsx` + `header.tsx` |

---

## 11. Design System Conventions

- **Backgrounds:** Light `#fcfcfd` / Dark `#0f0f11`
- **Cards:** `rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm`
- **Buttons primary:** `rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900`
- **Buttons ghost:** `rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors`
- **Header:** floating, `mx-4 mt-4 rounded-3xl border shadow-sm backdrop-blur-md`
- **Sidebar:** floating, `w-64 my-4 ml-4 rounded-3xl border sticky top-4`
- **Page content:** `p-6 max-w-3xl mx-auto` inside main area
- **Typography:** `tracking-tight` on headings; `text-xs font-semibold tracking-widest uppercase` on category labels
- **Animations:** Framer Motion spring `damping: 25, stiffness: 350` for modals; CSS `duration-150` for hovers
- **Custom utility:** `scrollbar-none` defined via `@utility` in `globals.css`

---

*Last updated: Phase 2 complete (M01–M11). Phase 3 next: M12 Food Search Index.*
