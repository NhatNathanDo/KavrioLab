# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 01. PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  
**Core Objective:** Complete functional and non-functional specifications of the KavrioLab application suites.

---

## 1. GENERAL PRODUCT ARCHITECTURE & SCHEMA

KavrioLab is divided into modular pillars. Every module below defines a critical capability of the SaaS system. To support AI-driven generation and manual development, each module is documented against the required 8-tier schema:
1. **Objective**
2. **Business Rules**
3. **User Flow**
4. **Functional Requirements**
5. **Non-Functional Requirements**
6. **Acceptance Criteria**
7. **Edge Cases**
8. **Future Improvements**

---

## 2. SYSTEM MODULES

### 2.1 AUTHENTICATION & ACCESS CONTROL
* **Objective:** Secure, frictionless, and multi-tenant authentication mapping roles to specific user spaces using Auth.js.
* **Business Rules:**
  - Password strength must be at least 10 characters, requiring 1 special character, 1 number, 1 uppercase letter, and 1 lowercase letter.
  - Accounts are locked for 15 minutes after 5 consecutive failed attempts.
  - JWT tokens expire after 24 hours. Refresh tokens are stored securely in HTTP-only cookies.
  - Social logins (Google, Apple) must automatically map to existing accounts if the verified email matches.
* **User Flow:**
  1. User navigates to `/auth/login`.
  2. Enters email/password or clicks "Continue with Google/Apple".
  3. On successful validation, the system issues a JWT, checks onboarding status, and redirects to `/dashboard` or `/onboarding`.
* **Functional Requirements:**
  - Standard email/password signup and login.
  - Social OAuth integration for Google and Apple.
  - Magic Link email authentication using Resend/Nodemailer.
  - Password reset flows via secure tokens sent to registered email.
  - Multifactor Authentication (MFA) via TOTP.
* **Non-Functional Requirements:**
  - Authentication delay must not exceed 800ms.
  - Passwords hashed using Argon2id.
* **Acceptance Criteria:**
  - Users cannot access `/dashboard` or internal routes without a valid session.
  - Redirect rules send unauthenticated traffic to `/login` immediately.
* **Edge Cases:**
  - Email case mismatch: Normalize all emails to lowercase before database ingestion.
  - Interrupted social login: Fallback gracefully to the login screen with an explanatory toast message.
* **Future Improvements:**
  - Passkey (WebAuthn) passwordless authentication implementation.

---

### 2.2 PROFILE MANAGEMENT
* **Objective:** Comprehensive user identity management, preferences, and physiological baselines.
* **Business Rules:**
  - Display names must be alphanumeric and between 3 and 30 characters.
  - Profile pictures are restricted to JPEG, PNG, or WebP up to 5MB.
  - Users can toggle between Metric (kg, cm, ml) and Imperial (lbs, inches, fl oz) systems.
* **User Flow:**
  1. User navigates to `/settings/profile`.
  2. Modifies bio, profile image, or physical units.
  3. Clicks "Save changes", triggering optimistic updates across the UI.
* **Functional Requirements:**
  - Update user metadata (name, bio, location).
  - Crop and upload profile pictures to Vercel Blob.
  - System-wide preference toggle for units of measure and timezone selection.
* **Non-Functional Requirements:**
  - Image scaling and optimization executed client-side before upload to reduce bandwidth.
* **Acceptance Criteria:**
  - Preference changes (e.g., metric to imperial) instantly update all weight metrics across charts, logs, and inputs without requiring page refreshes.
* **Edge Cases:**
  - High-frequency unit toggling: Debounce state updates to prevent rapid concurrent database writes.
* **Future Improvements:**
  - Multi-profile support (e.g., coach-client linked profiles).

---

### 2.3 ONBOARDING EXPERIENCE
* **Objective:** Capture critical biometric baselines and goals to dynamically configure the user's initial state.
* **Business Rules:**
  - Users cannot skip onboarding once registered; they are redirected back if they try to access internal pages directly.
  - Onboarding data must calculate initial daily caloric requirements using the Mifflin-St Jeor equation.
* **User Flow:**
  1. Complete step 1: Enter gender, birthdate, height, and weight.
  2. Complete step 2: Select fitness level (Beginner, Intermediate, Advanced) and equipment availability.
  3. Complete step 3: Choose primary goal (Lose Weight, Maintain, Build Muscle).
  4. Redirect to `/dashboard`.
* **Functional Requirements:**
  - Interactive multi-step form wizard with state saved to local storage until submission.
  - Dynamic equipment questionnaire (barbells, dumbbells, machines, resistance bands, bodyweight).
  - Automatic target calorie/macronutrient calculation.
* **Non-Functional Requirements:**
  - Step transitions must feel seamless, utilizing Framer Motion animations with under 200ms duration.
* **Acceptance Criteria:**
  - Onboarding submission writes to `UserProfile` and `OnboardingState` tables in a single transaction.
* **Edge Cases:**
  - User exits midway: Retrieve the last saved step from the DB or local storage upon reconnecting.
* **Future Improvements:**
  - Audio-guided onboarding for visually impaired users.

---

### 2.4 MAIN DASHBOARD
* **Objective:** A consolidated hub displaying readiness, workout calendars, calorie tracking, and dynamic insights.
* **Business Rules:**
  - Data must refresh automatically when the tab regains focus.
  - If a workout is currently active, a persistent widget must remain pinned to the top of the dashboard.
* **User Flow:**
  1. User logs in and lands on `/dashboard`.
  2. Views current daily targets (macros logged vs. goal, habit checkmarks, next workout).
  3. Interacts with quick-add logs (water tracker, weight entry).
* **Functional Requirements:**
  - Real-time rings/bars showing calories consumed vs. burned.
  - Mini calendar showing the current week's workout logs.
  - Quick-log widgets for quick body weight and water updates.
* **Non-Functional Requirements:**
  - Dashboard load time must be under 1.2 seconds, using pre-fetched queries.
* **Acceptance Criteria:**
  - Displays accurate percentages reflecting the user's logged metrics for the current day.
* **Edge Cases:**
  - Timezone change: Adjust historical days based on the user's currently local time.
* **Future Improvements:**
  - Drag-and-drop dashboard widget customization.

---

### 2.5 WORKOUT ENGINE
* **Objective:** The core logic engine driving active workout execution, set metrics, timers, and RPE logs.
* **Business Rules:**
  - A user can only run one active workout session at any time.
  - Rest timers must play an audible alert when they reach zero, even if the application is backgrounded.
  - RPE values must be constrained to the modified Borg scale (0.5 to 10) or RIR (0 to 5+).
* **User Flow:**
  1. Click "Start Workout" from a template or start an empty workout.
  2. Log weights, reps, and RPE. Toggle sets as complete.
  3. Rest timer starts automatically.
  4. Click "Finish Workout" to save the workout state.
* **Functional Requirements:**
  - Support for normal sets, warmups, drop sets, failure sets, and myo-reps.
  - Real-time elapsed workout timer.
  - Dynamic rest timer overlay with custom notification triggers.
  - Plate calculator helper interface (calculates weight needed on each side of a 20kg/15kg barbell).
* **Non-Functional Requirements:**
  - Optimistic UI updates for checking sets. Lag during log entry must be under 5ms.
* **Acceptance Criteria:**
  - The completed workout is successfully logged in PostgreSQL with correct tonnage, duration, and exercise volumes.
* **Edge Cases:**
  - Application crash during workout: Save live workout state to IndexedDB/local storage every 5 seconds to prevent data loss.
* **Future Improvements:**
  - Real-time heart rate sensor integration via Web Bluetooth API.

---

### 2.6 WORKOUT PROGRAM PLANNER
* **Objective:** Construct, organize, and assign structured programs (mesocycles) over multiple weeks.
* **Business Rules:**
  - A program can consist of multiple blocks/phases (e.g., Strength, Hypertrophy).
  - Programs must allow percentage-based programming based on user-estimated 1-Rep Max (1RM).
* **User Flow:**
  1. Navigate to `/programs/new`.
  2. Define program name, description, duration in weeks.
  3. Add workouts to specific days of the week, linking exercises and baseline set/rep schemes.
  4. Click "Assign to Profile" to schedule it on the calendar.
* **Functional Requirements:**
  - Create and edit programs with custom day structures.
  - Import public templates (e.g., PPL, Upper/Lower, 5/3/1).
  - Copy/paste training days.
* **Non-Functional Requirements:**
  - Drag-and-drop mechanics for reordering days must be smooth and touch-responsive (using `@hello-pangea/dnd` or Radix primitives).
* **Acceptance Criteria:**
  - Assigning a program automatically populates the user's training calendar with scheduled workouts.
* **Edge Cases:**
  - Editing a program while in progress: Ask the user if changes should apply retroactively or only to future weeks.
* **Future Improvements:**
  - Shared marketplace for community-driven program creators.

---

### 2.7 EXERCISE LIBRARY
* **Objective:** Clean, structured repository of human anatomy movements, equipment, and biomechanics.
* **Business Rules:**
  - Custom exercises created by users are private by default, with an option to request public inclusion.
  - Exercises must have at least one primary muscle group associated.
* **User Flow:**
  1. Navigate to `/exercises`.
  2. Search by keyword or apply filters (e.g., Dumbbell, Chest).
  3. View instructional video and performance history for that exercise.
* **Functional Requirements:**
  - Full-text search over 1,500+ pre-seeded items.
  - Filter options by category (Cardio, Strength, Flexibility), muscle group, and equipment.
  - Ability to create custom exercises with custom instructions.
* **Non-Functional Requirements:**
  - Search queries must be debounced by 200ms and run on localized memory databases where possible.
* **Acceptance Criteria:**
  - Selecting an exercise displays personal records and historical progression trends.
* **Edge Cases:**
  - System library conflicts with custom names: User's custom exercises are isolated using namespaces.
* **Future Improvements:**
  - Muscle fatigue heatmap visualization overlays in the exercise library page.

---

### 2.8 EXERCISE LOGGING & HISTORY
* **Objective:** Track historical weight, sets, reps, and RPE/RIR for every single exercise occurrence.
* **Business Rules:**
  - Personal Records (PRs) are evaluated across three categories: Max Weight, Max Volume, and Max 1RM.
  - Values from deleted workouts must not count towards historical PR calculations.
* **User Flow:**
  1. In `/workouts/logs`, user searches for a specific exercise.
  2. Views tabular history list showing every workout date, set details, and calculated 1RM.
* **Functional Requirements:**
  - Historical lookup engine linked directly to individual exercise IDs.
  - Auto-calculation of 1-Rep Max using Brzycki or Epley formulas:
    $$\text{1RM} = w \cdot \left(1 + \frac{r}{30}\right)$$
  - Standardized performance comparison metrics.
* **Non-Functional Requirements:**
  - Fetching performance history must complete in under 300ms using index optimizations on target foreign keys.
* **Acceptance Criteria:**
  - Accurately highlights personal records in real time during log inputs.
* **Edge Cases:**
  - User enters 0 reps or negative weight: Validation layer blocks submission via zod parsing errors.
* **Future Improvements:**
  - Velocity-based training tracker using phone camera inputs.

---

### 2.9 NUTRITION TRACKING
* **Objective:** Log food items, track macronutrients (protein, carbs, fat), and monitor micronutrient balances daily.
* **Business Rules:**
  - Calories from fats (9 kcal/g), proteins (4 kcal/g), carbs (4 kcal/g), and alcohol (7 kcal/g) must mathematically reconcile with total logged daily energy.
  - Caloric limits adjust dynamically when changing primary physical targets.
* **User Flow:**
  1. Navigate to `/nutrition`.
  2. Click "Log Food" -> select meal type (Breakfast, Lunch, Dinner, Snack).
  3. Search for food item, select quantity and serving size, then add to log.
* **Functional Requirements:**
  - Multi-meal structuring with adjustable meal names.
  - Micronutrient breakdown tracking (Sodium, Potassium, Fiber, Saturated Fat).
  - Quick-log macro entries for unlisted foods.
* **Non-Functional Requirements:**
  - The nutrient progress charts must render with smooth animations under 60fps on mobile displays.
* **Acceptance Criteria:**
  - Total caloric sum updates dynamically as items are edited or removed from logs.
* **Edge Cases:**
  - Logged food is missing from search results: Allow the user to immediately create a custom food item without leaving the current meal flow.
* **Future Improvements:**
  - Automated integration with smart scales and smart fridges.

---

### 2.10 FOOD DATABASE & CURATION
* **Objective:** Maintain a clean, verified catalog of global foods, ingredients, and nutritional data.
* **Business Rules:**
  - Public food items undergo validation queues before general availability.
  - Standardized units (grams/milliliters) must be present for all database items.
* **User Flow:**
  1. Search for a food item.
  2. If verified, a badge appears next to the name.
  3. If missing, select "Create Public Food", complete macros, and submit for moderation.
* **Functional Requirements:**
  - Support custom food entry.
  - Search indexes with ranking prioritized by verified status.
  - Integration with USDA FoodData Central and OpenFoodFacts database.
* **Non-Functional Requirements:**
  - Support full-text indexes in PostgreSQL (pg_trgm) for fuzzy matching.
* **Acceptance Criteria:**
  - Search results return accurate nutritional values corresponding to official USDA catalogs.
* **Edge Cases:**
  - Duplicate submissions: Automatically merge similar items based on UPC matches.
* **Future Improvements:**
  - Auto-translate food items based on user localization parameters.

---

### 2.11 BARCODE SCANNER
* **Objective:** Use device camera to scan UPC/EAN barcodes and instantly retrieve corresponding food records.
* **Business Rules:**
  - Requires explicit camera permissions on the device.
  - Barcode lookup fallback to manual entry if not found in local or external APIs.
* **User Flow:**
  1. Click the barcode scanner button.
  2. Align the barcode within the camera viewfinder viewport.
  3. On success, the matched food is presented with serving size logs.
* **Functional Requirements:**
  - Camera access overlay utilizing HTML5 canvas and WebRTC.
  - UPC/EAN barcode decoding using `@zxing/library`.
  - Background search on external OpenFoodFacts and custom database tables.
* **Non-Functional Requirements:**
  - Image decoding loop must execute at over 15 frames per second on modern browsers.
* **Acceptance Criteria:**
  - Scans valid barcodes and loads accurate food profiles within 1.5 seconds.
* **Edge Cases:**
  - Poor lighting: Provide a toggle for device torch support when available.
* **Future Improvements:**
  - Batch scanning of multiple items in a single camera session.

---

### 2.12 AI FOOD RECOGNITION
* **Objective:** Analyze photos of meals to automatically suggest ingredients, weights, and nutritional profiles.
* **Business Rules:**
  - AI estimates must display an explicit confidence rating and a warning indicating approximate values.
  - Images are parsed and details are verified by the user before writing to logs.
* **User Flow:**
  1. Click "Scan Meal with AI".
  2. Take a photo of the food plate.
  3. Review AI suggestions (e.g., "Chicken Breast - 150g, White Rice - 200g").
  4. Edit quantities as needed and click "Confirm and Log".
* **Functional Requirements:**
  - Upload image to Vercel Blob.
  - Match photo components using multimodal vision models (`Gemini 1.5 Pro` or similar).
  - Return structured JSON payloads mapping detected elements to database equivalents.
* **Non-Functional Requirements:**
  - Complete prompt translation and model analysis pipeline under 3.5 seconds.
* **Acceptance Criteria:**
  - Correctly identifies distinct foods (protein, carb, vegetable) on a plate.
* **Edge Cases:**
  - Unrecognizable items: Provide a fallback message requesting the user to name the dish manually for better model context.
* **Future Improvements:**
  - Multi-angle volume estimation for higher accuracy portion calculations.

---

### 2.13 MEAL PLANNER
* **Objective:** Design diet routines, schedule recipes, and preview weekly macro distributions.
* **Business Rules:**
  - Meal plans must match or warn users when they deviate from calculated caloric targets.
  - Must support template sharing between coach and client roles.
* **User Flow:**
  1. Navigate to `/nutrition/meal-plans`.
  2. Create a plan, designating days and target times.
  3. Populate days with recipes or individual foods.
* **Functional Requirements:**
  - Weekly meal template builders.
  - Dynamic shopping list generator aggregating ingredients.
  - Copy meals from one day to another.
* **Non-Functional Requirements:**
  - Shopping list queries optimized to join ingredient metrics efficiently.
* **Acceptance Criteria:**
  - Plan creation translates to active templates on the calendar.
* **Edge Cases:**
  - Ingredient units mismatch: Convert liquid ounces/milliliters to standard weights using average densities where possible.
* **Future Improvements:**
  - Direct integration with local online grocery delivery services.

---

### 2.14 AI COACH & ADAPTIVE INTELLIGENCE
* **Objective:** Predictive recommendations for training adjustments, diet targets, and recovery.
* **Business Rules:**
  - Recommendations must respect injury tags; exercises involving restricted joints must be filtered out.
  - Weekly calorie adjustments are limited to a maximum $+/-350\text{ kcal}$ per iteration to prevent unhealthy weight shifts.
* **User Flow:**
  1. Navigate to `/coach`.
  2. Chat with the coach or review weekly auto-generated updates.
  3. Approve recommendation to update weight-training schedules or calorie targets automatically.
* **Functional Requirements:**
  - Custom system prompt using historical user data (TDEE trend, sleeping patterns, training intensity).
  - Exercise substitution system based on current environment limits.
  - Recovery readiness calculations.
* **Non-Functional Requirements:**
  - Response streams must render using Server-Sent Events (SSE) for low latency perception.
* **Acceptance Criteria:**
  - Correctly adjusts training volume recommendations based on user-reported soreness patterns.
* **Edge Cases:**
  - Contradictory inputs (e.g., user wants to lose weight fast but inputs maintenance targets): AI highlights inconsistency gently.
* **Future Improvements:**
  - Personalized voice interface interactions.

---

### 2.15 WEIGHT TRENDS & METRIC TRACKING
* **Objective:** Monitor daily mass shifts and apply mathematical algorithms to compute true weight trends.
* **Business Rules:**
  - Calculate weight trend using a 7-day Exponential Moving Average (EMA):
    $$\text{Trend}_t = \alpha \cdot \text{Weight}_t + (1 - \alpha) \cdot \text{Trend}_{t-1}$$
    where $\alpha = 0.1428$ (representing $\frac{1}{7}$).
  - Weight values must be bounded within realistic physical thresholds ($25\text{ kg} - 350\text{ kg}$).
* **User Flow:**
  1. Open the weight log widget on the dashboard.
  2. Enter weight and optionally upload body fat percentage.
  3. View trend chart showing daily weights vs. the computed trend line.
* **Functional Requirements:**
  - Store decimal values with up to two digits of precision.
  - Calculate 7-day, 14-day, and 30-day weight trends.
  - Provide interactive graphs comparing active weight changes over time.
* **Non-Functional Requirements:**
  - Trend calculations must complete in under 5ms during DB query ingestion.
* **Acceptance Criteria:**
  - Moving trend calculations filter out daily fluid balance changes.
* **Edge Cases:**
  - Missing days: Interpolate missing weight points using the last logged value to maintain moving calculations.
* **Future Improvements:**
  - Sync with smart scales via Google Fit and Apple Health.

---

### 2.16 BODY MEASUREMENTS
* **Objective:** Track physical changes over time across major muscle groups and skeletal markers.
* **Business Rules:**
  - Historical measurement tracking supports both cm and inches.
  - Entries are limited to positive floating-point values between 5 and 200.
* **User Flow:**
  1. Navigate to `/progress/measurements`.
  2. Select target location (e.g., Waist, Left Bicep).
  3. Input measurement value and save.
* **Functional Requirements:**
  - 12 pre-seeded measurement points.
  - Progress chart representing circumference adjustments over time.
* **Non-Functional Requirements:**
  - Relational indexes configured to enable rapid sorting by date.
* **Acceptance Criteria:**
  - Visual maps represent measurement changes clearly over custom timeframes.
* **Edge Cases:**
  - Inconsistent unit values (e.g., logging inches then cm): Convert all values to a primary metric standard internally.
* **Future Improvements:**
  - 3D body mesh reconstruction using phone camera scans.

---

### 2.17 PROGRESS PHOTOS
* **Objective:** Visual archive of body changes over time with security and privacy protection.
* **Business Rules:**
  - Photos are private by default; metadata must strip EXIF geolocation information before uploads.
  - Photos are uploaded directly to Vercel Blob with size limits of 10MB per file.
* **User Flow:**
  1. Open `/progress/photos`.
  2. Select posture tag (Front, Side, Back).
  3. Upload image. Review side-by-side comparison.
* **Functional Requirements:**
  - Side-by-side comparison slider tools.
  - Secure media hosting.
  - Visual calendar timeline integration.
* **Non-Functional Requirements:**
  - Image delivery optimization via Edge CDN networks.
* **Acceptance Criteria:**
  - Visual media renders correctly on all device viewports.
* **Edge Cases:**
  - Network interruption: Cancel upload gracefully without saving incomplete database records.
* **Future Improvements:**
  - Auto-alignment overlays to help users take photos from the exact same distance and angle.

---

### 2.18 CALENDAR & SCHEDULING
* **Objective:** A centralized calendar interface to plan training, schedule meals, and view history.
* **Business Rules:**
  - Support both weekly view (mobile optimal) and monthly view (desktop optimal).
  - Drag-and-drop events adjust execution dates inside the database.
* **User Flow:**
  1. Open `/calendar`.
  2. Drag completed workout from Monday to Wednesday.
  3. The scheduled targets modify their states instantly.
* **Functional Requirements:**
  - Responsive layout adjusting dynamically to orientation.
  - Status indicators highlighting completed, skipped, or planned workouts.
* **Non-Functional Requirements:**
  - React calendar renders must be optimized using virtualized grids.
* **Acceptance Criteria:**
  - Calendar accurately represents daily activities with visual status cues.
* **Edge Cases:**
  - Multi-timezone events: Store dates as UTC internally, displaying them using the local browser offset.
* **Future Improvements:**
  - Subscription synchronization with Google Calendar and Apple Calendar (iCal format).

---

### 2.19 WATER TRACKER
* **Objective:** Log daily hydration intake relative to target goals.
* **Business Rules:**
  - Quick-add values (e.g., 250ml, 500ml) can be configured by the user.
  - Log resets daily at midnight based on user's timezone.
* **User Flow:**
  1. Click water widget on dashboard.
  2. Select quick-add option.
  3. Total volume increments; target status ring fills.
* **Functional Requirements:**
  - Custom container profiles.
  - Multi-unit conversion support.
* **Non-Functional Requirements:**
  - Touch latency for quick-add clicks must be under 50ms.
* **Acceptance Criteria:**
  - Accurately tracks daily hydration logs.
* **Edge Cases:**
  - Fast repetitive logging: Prevent duplicate log entries by debouncing click actions.
* **Future Improvements:**
  - Hydration push notification reminders based on localized temperature.

---

### 2.20 SLEEP LOGGING
* **Objective:** Log sleep duration, architecture, and subjective sleep quality metrics.
* **Business Rules:**
  - Sleep entries cannot overlap within a single 24-hour window.
  - Sleep duration is validated to be between 1 and 24 hours.
* **User Flow:**
  1. Open `/sleep`.
  2. Enter sleep start, wake time, and sleep quality (1-5 scale).
  3. View historical sleep data charts.
* **Functional Requirements:**
  - Manual sleep entry forms.
  - Automatic ingestion from Apple Health / Google Fit when API is active.
* **Non-Functional Requirements:**
  - Sleep analytics graphs optimized for fast queries.
* **Acceptance Criteria:**
  - Correctly calculates sleep duration based on start and wake times.
* **Edge Cases:**
  - Sleeping past midnight: System shifts log to the day of waking up to maintain standard tracking alignment.
* **Future Improvements:**
  - Dynamic recovery score calculated by combining sleep data with workout volume.

---

### 2.21 HABIT TRACKER
* **Objective:** Support daily habit formation with checkmarks, streak counts, and compliance analysis.
* **Business Rules:**
  - Habit completion is validated against the current day.
  - Streaks break if habit is not logged by the end of the user's timezone day.
* **User Flow:**
  1. Create habit (e.g., "10k steps", daily occurrence).
  2. Check off habit on dashboard.
  3. Streak counter increases.
* **Functional Requirements:**
  - Custom frequency limits (Daily, Weekly, Specific Days).
  - Streak tracking algorithm.
* **Non-Functional Requirements:**
  - Render habit grids using lightweight SVG grids to maintain performance.
* **Acceptance Criteria:**
  - Streak rules calculate active, total, and longest streak values accurately.
* **Edge Cases:**
  - Manual retro-logging: recalculate historical streaks whenever a past day is edited.
* **Future Improvements:**
  - Group habits to support collaborative streaks.

---

### 2.22 GOAL SETTING & TRACKING
* **Objective:** Define measurable objectives (e.g., bench press target, body fat target) and track progress.
* **Business Rules:**
  - Goals must fall under supported target categories (Weight, Strength, Body Fat, Workout Frequency).
  - Progress updates automatically using linked logs (e.g., bench press log updates bench press goal).
* **User Flow:**
  1. Navigate to `/goals/new`.
  2. Select target metric (e.g., 1RM Bench Press).
  3. Input target value and deadline.
  4. View goal progression meter.
* **Functional Requirements:**
  - Create, edit, and delete goal targets.
  - Automatic progress updates from linked database tables.
* **Non-Functional Requirements:**
  - Keep check frequencies optimized using cron runs instead of synchronous writes.
* **Acceptance Criteria:**
  - Status updates to "Achieved" once validation rules match.
* **Edge Cases:**
  - Changing target units: Ensure goal limits convert cleanly to match active profile units.
* **Future Improvements:**
  - Automated goal suggestions powered by AI Coach baseline history.

---

### 2.23 ACHIEVEMENT SYSTEM
* **Objective:** Motivate users with badges and level progressions based on milestone events.
* **Business Rules:**
  - Achievements are read-only for users and are triggered only by system events.
  - Badges are assigned to user profiles via single-write database logs.
* **User Flow:**
  1. Complete a workout.
  2. If the workout triggers a milestone, a celebratory modal pops up.
  3. Badge becomes visible in the user's profile.
* **Functional Requirements:**
  - Event listener patterns detecting specific milestones.
  - Badges repository.
* **Non-Functional Requirements:**
  - Trigger evaluation must run asynchronously in background jobs.
* **Acceptance Criteria:**
  - Event triggers correctly write achievements to the database.
* **Edge Cases:**
  - Deleting a workout that triggered an achievement: Keep the badge unlocked once achieved.
* **Future Improvements:**
  - Share achievements to social media profiles.

---

### 2.24 NOTIFICATION ENGINE
* **Objective:** Manage dynamic alerts (push notifications, email notifications, system messages).
* **Business Rules:**
  - Respect user preference flags for all notification types.
  - Group high-frequency events into single digests (e.g., comments on workout logs).
* **User Flow:**
  1. Open app preferences.
  2. Toggle off email updates for weekly coach recommendations.
  3. Save. System halts corresponding email queues.
* **Functional Requirements:**
  - Push notification token registration via Service Workers.
  - In-app notification feed.
  - Email templates integrated with Resend.
* **Non-Functional Requirements:**
  - System messages must deliver within 2 seconds of the triggering action.
* **Acceptance Criteria:**
  - Email and push delivery conform strictly to configuration logs.
* **Edge Cases:**
  - Stale device tokens: Automatically clean up tokens on third failed delivery attempt.
* **Future Improvements:**
  - Smart delivery timing based on historic user activity windows.

---

### 2.25 ANALYTICS & WEEKLY REPORTS
* **Objective:** Aggregated reporting, charts, and data insights delivered on demand.
* **Business Rules:**
  - Summaries compile data from Monday to Sunday using the user's localized timezone.
  - PDF/CSV generation occurs on the server to prevent UI lag.
* **User Flow:**
  1. Open `/analytics`.
  2. Select timeframe (e.g., Last 30 Days).
  3. Review charts or export data.
* **Functional Requirements:**
  - Volume load charts.
  - Macro adherence reports.
  - CSV/PDF export formats.
* **Non-Functional Requirements:**
  - Pre-aggregate data models to avoid scanning large historical datasets on every page load.
* **Acceptance Criteria:**
  - Volume calculations match workout log totals.
* **Edge Cases:**
  - Empty datasets: Render placeholders explaining how to populate analytics.
* **Future Improvements:**
  - Predictive modeling showing estimated future muscle growth trends.

---

### 2.26 ADMIN PANEL & CMS
* **Objective:** Direct database management, database curation, and user support tools.
* **Business Rules:**
  - Access is restricted to accounts with roles: `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.
  - Sensitive operations (e.g., delete user profile) require re-authentication.
* **User Flow:**
  1. Navigate to `/admin`.
  2. Access the moderation queue.
  3. Approve or edit user-submitted food entries.
* **Functional Requirements:**
  - User search and management dashboard.
  - Food database curation queue.
  - System performance telemetry overview.
* **Non-Functional Requirements:**
  - Admin assets and scripts are code-split and loaded only for admin users.
* **Acceptance Criteria:**
  - Non-admins attempting to access `/admin` receive a 403 response.
* **Edge Cases:**
  - Session timeout during admin actions: Prompt for login without losing current changes.
* **Future Improvements:**
  - Interactive SQL terminal for super admins with audit trails.

---

### 2.27 SETTINGS & SYSTEM UTILITIES
* **Objective:** Centralized system configurations and user data utilities.
* **Business Rules:**
  - Account deletion must purge all personal data, photos, and metrics (GDPR compliant).
  - Users can export all account data in standardized JSON format.
* **User Flow:**
  1. Navigate to `/settings`.
  2. Select "Export Data".
  3. Receive download link with complete JSON file containing physical metrics, nutrition logs, and workout history.
* **Functional Requirements:**
  - Clear user account data.
  - Export and import functionality.
  - Dynamic language options.
* **Non-Functional Requirements:**
  - Account exports must be processed asynchronously if data exceeds 50MB.
* **Acceptance Criteria:**
  - JSON outputs map directly to database formats.
* **Edge Cases:**
  - Invalid import file structures: Validation layer stops processing and outputs useful syntax error notes.
* **Future Improvements:**
  - Directly import data packages from other fitness apps (e.g., MFP, Strong).

---

### 2.28 OFFLINE SUPPORT, PWA & DEVICE INTEGRATION
* **Objective:** Maintain core tracking functionality when user is disconnected from network coverage.
* **Business Rules:**
  - Service worker caches core layouts and dependencies.
  - Pending mutations are stored in IndexedDB and resolved sequentially when connection is restored.
* **User Flow:**
  1. Go offline.
  2. Log a workout set.
  3. App saves the change to local cache with an "Offline log" badge.
  4. Go online. The change is synced with the server database.
* **Functional Requirements:**
  - Manifest file for PWA compatibility.
  - Local sync engine queue.
* **Non-Functional Requirements:**
  - Local storage queries must complete in under 5ms.
* **Acceptance Criteria:**
  - Offline sessions are successfully merged when connection is restored.
* **Edge Cases:**
  - Sync conflicts: If a workout was modified on two different devices while offline, prompt the user to resolve the conflict.
* **Future Improvements:**
  - Background sync API integration for auto-merging logs.

---

### 2.29 ACCESSIBILITY, THEME & SYSTEM PREFERENCES
* **Objective:** Ensure KavrioLab is accessible and comfortable for all users.
* **Business Rules:**
  - Support Light Mode, Dark Mode, and System Default preferences.
  - Keyboard navigation is fully supported across all pages.
* **User Flow:**
  1. Open settings -> select Light Mode.
  2. App switches color themes instantly.
* **Functional Requirements:**
  - Contrast ratios conform to WCAG guidelines.
  - Custom CSS variables for theme modes.
* **Non-Functional Requirements:**
  - Theme switching must not cause a flash of unstyled content (FOUC).
* **Acceptance Criteria:**
  - Interactive components support standard keyboard shortcuts.
* **Edge Cases:**
  - Theme transitions: Transition all structural colors smoothly using CSS variables.
* **Future Improvements:**
  - High-contrast visual modes for outdoor gym use.

---

### 2.30 SUBSCRIPTIONS & STRIPE INTEGRATION
* **Objective:** Handle subscription billing, tier structures, and trial periods.
* **Business Rules:**
  - Free tier is limited to 3 custom workouts and 1 workout program.
  - Premium tier unlocks unlimited workouts, AI Coaching, and advanced analytics.
* **User Flow:**
  1. Navigate to `/settings/billing`.
  2. Click "Upgrade to Premium".
  3. Complete payment in Stripe Checkout modal.
  4. App updates subscription status instantly.
* **Functional Requirements:**
  - Stripe webhook handler.
  - Dynamic user access checking.
* **Non-Functional Requirements:**
  - Stripe responses processed within 2 seconds.
* **Acceptance Criteria:**
  - Revoking payment updates the user's role and locks premium features.
* **Edge Cases:**
  - Payment failure during subscription renewal: Provide a 3-day grace period before locking access.
* **Future Improvements:**
  - Support local payment options (e.g., Apple Pay, Google Pay).

---

### 2.31 FUTURE ENTERPRISE CAPABILITIES
* **Objective:** Prepare systems for future expansions (e.g., Gym Teams, Enterprise Health Packages).
* **Business Rules:**
  - Enterprise plans isolate workspaces with multi-tenant subdomains.
* **User Flow:**
  1. Enterprise admin signs up at `/enterprise/signup`.
  2. Creates sub-user profiles for team members.
* **Functional Requirements:**
  - Team dashboard.
  - Bulk account billing.
* **Non-Functional Requirements:**
  - Scalability architecture to support organizations with 10k+ users.
* **Acceptance Criteria:**
  - Admins can manage team access permissions.
* **Edge Cases:**
  - User moves between teams: Transfer history while resetting team assignments.
* **Future Improvements:**
  - Direct integration with corporate wellness programs.

---
*End of Document: 01_PRODUCT_REQUIREMENTS.md — Proceed to 02_USER_PERSONAS.md*
