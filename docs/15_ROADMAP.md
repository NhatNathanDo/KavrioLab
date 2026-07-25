# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 15. MILESTONE ROADMAP & TIMELINE

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document outlines the 35 sequential milestones for building the KavrioLab platform, structured across 7 execution phases.

---

## 1. PHASE 1: FOUNDATION & SYSTEM ASSIGNMENTS (M01 - M05)

### M01: Repository Scaffolding & Configs
- **Objective:** Configure Next.js 15, Tailwind CSS, TypeScript configurations, and Vitest testing structures.
- **Tasks:** Run installer processes, initialize git configurations, setup root configs, and create linter profiles.
- **Deliverables:** Working repository template compile-ready.
- **Dependencies:** None.
- **Acceptance Criteria:** Repository compiles locally with zero configuration warnings.
- **Estimated Complexity:** `Small`

### M02: Schema Migration & Prisma Scaffolding
- **Objective:** Deploy initial PostgreSQL schema containing user tables, security profiles, and migration paths.
- **Tasks:** Build `schema.prisma` definitions, run first migrations, and configure connection pools.
- **Deliverables:** Active PostgreSQL instance with migration histories.
- **Dependencies:** M01.
- **Acceptance Criteria:** Prisma migration scripts run successfully.
- **Estimated Complexity:** `Medium`

### M03: Authentication Logic & Session Middleware
- **Objective:** Set up Auth.js v5 with magic links, email authentication, and OAuth login options.
- **Tasks:** Write security middlewares, setup route controllers, and link Auth.js configurations.
- **Deliverables:** Secure authentication paths `/login` and `/register`.
- **Dependencies:** M02.
- **Acceptance Criteria:** Unauthorized routes redirect users to `/login`.
- **Estimated Complexity:** `Medium`

### M04: Dynamic Onboarding Form
- **Objective:** Capture user goals, biometrics, and physical measurements.
- **Tasks:** Create multi-step validation components using React Hook Form and Zod schemas.
- **Deliverables:** Interactive onboarding screen.
- **Dependencies:** M03.
- **Acceptance Criteria:** Onboarding outputs calculations for daily targets correctly.
- **Estimated Complexity:** `Medium`

### M05: Global Navigation & Dashboard Skeleton
- **Objective:** Responsive sidebar layout and layout panels for the main app.
- **Tasks:** Build navigation controls, responsive layouts, and basic dashboard views.
- **Deliverables:** Dashboard landing layout.
- **Dependencies:** M04.
- **Acceptance Criteria:** Dashboard fits all responsive grid requirements.
- **Estimated Complexity:** `Small`

---

## 2. PHASE 2: CORE WORKOUT LOGIC (M06 - M11)

### M06: Exercise Library Database
- **Objective:** Database tables containing 1,500+ pre-seeded exercises.
- **Tasks:** Write seed data scripts and run database population processes.
- **Deliverables:** Seeded `Exercise` database tables.
- **Dependencies:** M02.
- **Acceptance Criteria:** Search queries return matching exercise details.
- **Estimated Complexity:** `Medium`

### M07: Live Workout Logger (State Interface)
- **Objective:** UI panels to log sets, reps, and weights during workouts.
- **Tasks:** Setup Zustand stores and build forms to capture workout logs.
- **Deliverables:** Workout execution view `/workouts/active`.
- **Dependencies:** M05, M06.
- **Acceptance Criteria:** Set values update and save in state.
- **Estimated Complexity:** `Large`

### M08: Rest Timer Component
- **Objective:** Automatically trigger rest timers on set completion.
- **Tasks:** Write background workers and sound alerts.
- **Deliverables:** Countdown overlays in workout log pages.
- **Dependencies:** M07.
- **Acceptance Criteria:** Checking a completed set launches the countdown.
- **Estimated Complexity:** `Small`

### M09: Program & Routine Builder
- **Objective:** Template structures to schedule exercises.
- **Tasks:** Build program configuration interfaces.
- **Deliverables:** Program creation views.
- **Dependencies:** M07.
- **Acceptance Criteria:** Programs output structured calendar events.
- **Estimated Complexity:** `Large`

### M10: Plate Calculator Utility
- **Objective:** Barbell plate calculators on active logging cards.
- **Tasks:** Implement greedy allocation math algorithms.
- **Deliverables:** Inline calculation widgets.
- **Dependencies:** M07.
- **Acceptance Criteria:** Outputs correct plate arrangements based on weight targets.
- **Estimated Complexity:** `Small`

### M11: History & Log Archive
- **Objective:** Historical list of completed training sessions.
- **Tasks:** Write search services and detailed layout logs.
- **Deliverables:** Workout history archive screens.
- **Dependencies:** M07.
- **Acceptance Criteria:** Logs list date, volume, and sets correctly.
- **Estimated Complexity:** `Medium`

---

## 3. PHASE 3: NUTRITION & SCANNER PIPELINES (M12 - M17)

### M12: Food Search Index
- **Objective:** Search foods across local datasets and OpenFoodFacts APIs.
- **Tasks:** Setup API client integration wrappers.
- **Deliverables:** Search components mapping nutritional values.
- **Dependencies:** M05.
- **Acceptance Criteria:** Search queries return food item values.
- **Estimated Complexity:** `Medium`

### M13: Daily Nutrition Tracker Dashboard
- **Objective:** Visual rings detailing logged calories, carbs, fat, and protein.
- **Tasks:** Build daily logging panels.
- **Deliverables:** Calories tracking overview dashboards.
- **Dependencies:** M12.
- **Acceptance Criteria:** Consumed nutrient quantities display relative to targets.
- **Estimated Complexity:** `Medium`

### M14: Web Barcode Scanner
- **Objective:** Decode barcodes using device camera.
- **Tasks:** Integrate camera logic and `@zxing/library` decoders.
- **Deliverables:** Dynamic barcode scanning panels.
- **Dependencies:** M12.
- **Acceptance Criteria:** Scanning a barcode retrieves matching food profiles.
- **Estimated Complexity:** `Large`

### M15: Custom Foods & Recipes Creator
- **Objective:** Group ingredients to log custom food items.
- **Tasks:** Create calculation schemas.
- **Deliverables:** Custom recipe creation forms.
- **Dependencies:** M13.
- **Acceptance Criteria:** Custom items save to user profiles.
- **Estimated Complexity:** `Medium`

### M16: Shopping List & Meal Plan Builder
- **Objective:** Plan meals weekly and calculate ingredient lists.
- **Tasks:** Setup shopping aggregators.
- **Deliverables:** Meal template planners.
- **Dependencies:** M15.
- **Acceptance Criteria:** Meal planners update shopping target logs.
- **Estimated Complexity:** `Medium`

### M17: Offline Nutrition Sync Pipeline
- **Objective:** Cache nutrition log mutations when disconnected from network.
- **Tasks:** Configure service worker databases.
- **Deliverables:** Sync engine handlers.
- **Dependencies:** M13.
- **Acceptance Criteria:** Offline inputs sync to DB on reconnect.
- **Estimated Complexity:** `Large`

---

## 4. PHASE 4: BIOMETRICS & PHOTO VAULTS (M18 - M23)

### M18: Weight Log & Trend Line Chart
- **Objective:** Log weight and view trend lines.
- **Tasks:** Implement EMA trend algorithms.
- **Deliverables:** Weight tracker widgets.
- **Dependencies:** M05.
- **Acceptance Criteria:** Weight charts display moving trends correctly.
- **Estimated Complexity:** `Medium`

### M19: Circumference Log Maps
- **Objective:** Record body measurements across 12 target points.
- **Tasks:** Build input systems with unit selector rules.
- **Deliverables:** Body measurements logs.
- **Dependencies:** M05.
- **Acceptance Criteria:** Saves measurements to corresponding profile metrics.
- **Estimated Complexity:** `Small`

### M20: Progress Photo Vault (Vercel Blob)
- **Objective:** Secure, private uploads for progress photos.
- **Tasks:** Write EXIF metadata scrubbing scripts.
- **Deliverables:** Progress photo galleries.
- **Dependencies:** M05.
- **Acceptance Criteria:** Uploaded image files save to Vercel Blob storage.
- **Estimated Complexity:** `Medium`

### M21: Photo Slider Comparison UI
- **Objective:** Overlay two progress photos to visually compare changes.
- **Tasks:** Build slider controls.
- **Deliverables:** Swipe comparison overlays.
- **Dependencies:** M20.
- **Acceptance Criteria:** Slider overlays render cleanly.
- **Estimated Complexity:** `Medium`

### M22: Water Intake Tracker Widget
- **Objective:** Log daily hydration with quick-add preset buttons.
- **Tasks:** Write state modifiers.
- **Deliverables:** Water tracking widget panels.
- **Dependencies:** M05.
- **Acceptance Criteria:** Quick-add buttons increment daily volumes correctly.
- **Estimated Complexity:** `Small`

### M23: Sleep Duration & Quality Logger
- **Objective:** Manual and wear-synced sleep tracker inputs.
- **Tasks:** Setup input templates.
- **Deliverables:** Sleep log dashboards.
- **Dependencies:** M05.
- **Acceptance Criteria:** Logs bedtime durations correctly.
- **Estimated Complexity:** `Medium`

---

## 5. PHASE 5: AI INTEGRATION ARCHITECTURE (M24 - M28)

### M24: Multimodal AI Photo Scanner
- **Objective:** Scan food photos and estimate calorie breakdowns.
- **Tasks:** Integrate Gemini 1.5 Pro API calls.
- **Deliverables:** AI food photo scanner modules.
- **Dependencies:** M13.
- **Acceptance Criteria:** Outputs structured JSON containing ingredients.
- **Estimated Complexity:** `Extra Large`

### M25: Dynamic AI TDEE Engine
- **Objective:** Automatically adjust user targets based on weight trends.
- **Tasks:** Build background calculator workers.
- **Deliverables:** Adaptive calorie calculators.
- **Dependencies:** M13, M18.
- **Acceptance Criteria:** Weekly adjustments are logged correctly.
- **Estimated Complexity:** `Large`

### M26: Chat Interface for AI Coach
- **Objective:** Contextual RAG coaching chat.
- **Tasks:** Configure context injection templates.
- **Deliverables:** Interactive chat layouts.
- **Dependencies:** M25.
- **Acceptance Criteria:** Coach responds with recommendations matching user history.
- **Estimated Complexity:** `Large`

### M27: AI Exercise Substitutor
- **Objective:** AI suggestions for exercise swaps during active workouts.
- **Tasks:** Build substitution models.
- **Deliverables:** Substitution cards.
- **Dependencies:** M07, M26.
- **Acceptance Criteria:** Swaps exercises to match muscle targets and equipment.
- **Estimated Complexity:** `Medium`

### M28: Automated Workout Plan Progression
- **Objective:** Progressive overload calculations.
- **Tasks:** Write weight projection services.
- **Deliverables:** Progression logs.
- **Dependencies:** M07, M25.
- **Acceptance Criteria:** Automatically suggests target weights for next sessions.
- **Estimated Complexity:** `Medium`

---

## 6. PHASE 6: SCHEDULE & HABIT INTEGRATIONS (M29 - M32)

### M29: Habit Track Grids
- **Objective:** Custom habits with heatmaps.
- **Tasks:** Build compliance grids.
- **Deliverables:** Habit dashboard cards.
- **Dependencies:** M05.
- **Acceptance Criteria:** Highlights daily checkmarks.
- **Estimated Complexity:** `Medium`

### M30: Weekly Workout Scheduler (Drag-and-Drop)
- **Objective:** Reschedule exercises on the calendar.
- **Tasks:** Build drag-and-drop components.
- **Deliverables:** Calendar scheduler views.
- **Dependencies:** M09.
- **Acceptance Criteria:** Reordering workouts updates scheduled dates.
- **Estimated Complexity:** `Large`

### M31: Multi-view Calendar Page
- **Objective:** Unified monthly and weekly calendar views.
- **Tasks:** Render calendar details.
- **Deliverables:** Calendar screens.
- **Dependencies:** M30.
- **Acceptance Criteria:** Renders completed workouts and macro states.
- **Estimated Complexity:** `Medium`

### M32: System Web Push Engine
- **Objective:** Send reminder notifications.
- **Tasks:** Integrate service worker notifications.
- **Deliverables:** Dynamic alert systems.
- **Dependencies:** M03.
- **Acceptance Criteria:** Triggers alerts based on active rest timers.
- **Estimated Complexity:** `Large`

---

## 7. PHASE 7: ANALYTICS & BILLING ENGINES (M33 - M35)

### M33: Volume & 1RM Progression Analytics
- **Objective:** Recharts graphs for volume load and 1RM progress.
- **Tasks:** Write aggregation queries.
- **Deliverables:** Analytics dashboards.
- **Dependencies:** M11.
- **Acceptance Criteria:** Renders charts matching completed workout records.
- **Estimated Complexity:** `Large`

### M34: Stripe Subscription Gateway
- **Objective:** Premium subscriptions with Stripe.
- **Tasks:** Setup Stripe webhooks.
- **Deliverables:** Billing settings pages.
- **Dependencies:** M03.
- **Acceptance Criteria:** Restricts premium access for free tier accounts.
- **Estimated Complexity:** `Large`

### M35: Admin Portal & Moderation Board
- **Objective:** CMS tools for platform data management.
- **Tasks:** Create user search and food databases lists.
- **Deliverables:** Admin panels `/admin`.
- **Dependencies:** M03.
- **Acceptance Criteria:** Non-admin accounts receive 403 responses.
- **Estimated Complexity:** `Large`

---
*End of Document: 15_ROADMAP.md — Proceed to 16_SECURITY.md*
