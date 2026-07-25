# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 03. USER STORIES SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the functional user stories for the KavrioLab platform, structured by feature epic. Every user story is defined using the standard syntax, accompanied by clear acceptance criteria and technical requirements.

---

## 1. EPIC: IDENTITY, ONBOARDING & ACCESS CONTROL

### US-101: Secure Email Authentication
* **User Story:** As a new user, I want to sign up with my email and password so that I can create a secure personal profile.
* **Acceptance Criteria:**
  - Password inputs enforce a minimum length of 10 characters, requiring a number, capital letter, and special character.
  - Generates a verification email to the user's address.
  - Unauthorized users are restricted from accessing internal `/dashboard` routes.
* **Technical Constraints:** Passwords must be hashed using Argon2id before database storage.

### US-102: Third-Party Authentication
* **User Story:** As an existing user, I want to sign in using my Google or Apple account so that I can access the app quickly without typing passwords.
* **Acceptance Criteria:**
  - Clicking "Continue with Google/Apple" redirects to the provider's OAuth screen.
  - Matches the OAuth email with existing user records to prevent duplicate accounts.
* **Technical Constraints:** Handled securely via Auth.js v5 route handlers.

### US-103: Dynamic Biometric Onboarding Wizard
* **User Story:** As a newly registered user, I want to complete a step-by-step onboarding wizard so that my initial daily caloric needs and fitness preferences are configured.
* **Acceptance Criteria:**
  - Wizard splits onboarding into: Biometrics (Height/Weight), Fitness Level & Equipment, and Goals.
  - System computes initial target TDEE and macros using the Mifflin-St Jeor equation.
  - Progress state persists locally, allowing users to resume onboarding if interrupted.
* **Technical Constraints:** Must write all onboarding parameters to user profile tables in a single transaction.

### US-104: Profile Preferences Management
* **User Story:** As a user, I want to configure system measurement units (metric/imperial) so that my weights, heights, and volumes display correctly.
* **Acceptance Criteria:**
  - Option toggles in settings between Metric (kg, cm, ml) and Imperial (lbs, inches, fl oz).
  - Toggling units instantly converts all historical charts, logging tables, and active inputs.
* **Technical Constraints:** Store physical values in standard metric units inside the database; apply unit conversions on the client side.

---

## 2. EPIC: WORKOUT ENGINE & PLANNING

### US-201: Plan custom training programs (Mesocycles)
* **User Story:** As an advanced lifter, I want to construct multi-week training programs with specific exercises, sets, reps, and RPE targets.
* **Acceptance Criteria:**
  - Program creator allows adding weeks, training days, and individual exercise groups.
  - Supports superset groupings.
  - Users can assign created programs to their active schedules.
* **Technical Constraints:** Prisma relations must cascade updates correctly when days or weeks are reordered.

### US-202: Live workout logging interface
* **User Story:** As a gym user, I want to log my weights, reps, and RPE in real time so that I can track my workout performance.
* **Acceptance Criteria:**
  - Tracks elapsed workout duration dynamically.
  - Checking a set as complete updates the completed state and starts the rest timer.
  - Display previous set values as ghost text for reference.
* **Technical Constraints:** Live workout state must persist in IndexedDB to protect against browser crashes.

### US-203: Automated Rest Timers
* **User Story:** As a weightlifter, I want a rest timer to start automatically when I complete a set, so that I can maintain consistent rest periods.
* **Acceptance Criteria:**
  - Checkmarking a set triggers a visual countdown timer.
  - Rest duration can be adjusted inline during workouts.
  - Plays an audible tone when the timer reaches zero.
* **Technical Constraints:** Utilize Web Audio API and local notifications to ensure timers run reliably in the background.

### US-204: Plate Calculator Helper
* **User Story:** As a powerlifter, I want a plate calculator overlay on the logging screen so that I can configure barbell loading configurations without manual math.
* **Acceptance Criteria:**
  - Displays a visual representation of plates required per side.
  - Supports standard bar weights (15kg, 20kg, 25kg) and plate denominations.
* **Technical Constraints:** UI widget calculated dynamically using greedy algorithms based on active bar configurations.

### US-205: Fast Exercise Substitution
* **User Story:** As a peak gym user, I want to swap an exercise during an active workout so that I can continue training when target machines are occupied.
* **Acceptance Criteria:**
  - Dynamic swap action replaces the target exercise while maintaining the logged set count.
  - Displays alternative options based on targeted muscle groups and available equipment.
* **Technical Constraints:** Updates active session memory state instantly without executing full database writes.

---

## 3. EPIC: NUTRITION & FOOD MANAGEMENT

### US-301: Log Daily Food Ingestion
* **User Story:** As a nutrition-focused user, I want to search and log food items into categorized daily meals, so that I can track my macronutrient consumption.
* **Acceptance Criteria:**
  - Search returns results categorized by brand name and verified status.
  - Users can input serving sizes in various units (grams, ounces, milliliters).
  - Summarizes current meal macros and displays them relative to daily goals.
* **Technical Constraints:** Multi-column indexing on the food database table to ensure search response times are under 100ms.

### US-302: Instant Barcode Scanner
* **User Story:** As a consumer, I want to scan food barcodes with my device camera to instantly retrieve and log matching items.
* **Acceptance Criteria:**
  - Scanner button launches the camera overlay.
  - Decodes UPC/EAN barcodes instantly.
  - Automatically loads the match details or prompts to create a new food entry if not found.
* **Technical Constraints:** Uses `@zxing/library` client-side, falling back gracefully to manual search if camera permission is denied.

### US-303: AI Food Photo Recognition
* **User Story:** As a busy user, I want to photograph my meals to estimate calorie and macronutrient values.
* **Acceptance Criteria:**
  - User can capture a photo or upload an image from their gallery.
  - AI estimates food components, weights, and macronutrient values.
  - Displays estimations for confirmation before adding details to user logs.
* **Technical Constraints:** Images are stored in Vercel Blob; analysis is handled via structured JSON outputs from multimodal vision models.

### US-304: Recipe Builder & Ingredient Aggregator
* **User Story:** As a home cook, I want to group individual ingredients into a reusable recipe so that I can log portion slices easily.
* **Acceptance Criteria:**
  - Recipe builder allows adding multiple ingredients with weights.
  - Computes total recipe yield and nutritional profile per serving.
  - Recipe can be logged as a single serving item.
* **Technical Constraints:** Database models must link recipes to ingredients without causing recursive query lags.

---

## 4. EPIC: BIOMETRICS, HEALTH & PROGRESS METRICS

### US-401: Algorithmic Weight Tracking
* **User Story:** As a weight-conscious user, I want to log my daily weight and view calculated trend lines, so that I can filter out daily water weight fluctuations.
* **Acceptance Criteria:**
  - Weight input accepts decimal values (e.g., 78.4 kg).
  - Calculates and displays a 7-day exponential moving average trend line on progress charts.
* **Technical Constraints:** Weight trend calculated on save using database triggers or service methods.

### US-402: Body Measurements Journal
* **User Story:** As a bodybuilder, I want to record body part measurements so that I can track muscle growth and fat loss changes.
* **Acceptance Criteria:**
  - User can select and enter measurements for 12 standardized body regions.
  - Progress views display historical metrics in tabbed tables and charts.
* **Technical Constraints:** Validate inputs using positive decimal ranges under 200cm.

### US-403: Encrypted Progress Photo Vault
* **User Story:** As a user, I want to store progress photos securely within the application to track my physical progress over time.
* **Acceptance Criteria:**
  - Upload interface accepts frontal, lateral, and dorsal photos.
  - Strips metadata (such as EXIF location details) from photos before storage.
  - Provides side-by-side comparison slider tools.
* **Technical Constraints:** Photos are stored in Vercel Blob and referenced with private database profiles.

### US-404: Integrated Water Log
* **User Story:** As a health-conscious user, I want to track my daily water intake using quick-add preset buttons.
* **Acceptance Criteria:**
  - Displays hydration target completion ring.
  - Quick-add buttons add predefined volumes (250ml, 500ml) to the log with a single tap.
* **Technical Constraints:** Optimistic UI mutations instantly fill progress indicators while requests process in the background.

### US-405: Sleep Hygiene Logging
* **User Story:** As an athlete, I want to track my sleep durations and subjective sleep quality, so that I can correlate recovery metrics with my training performance.
* **Acceptance Criteria:**
  - Input form records bedtimes, wake times, and sleep quality ratings (1 to 5 stars).
  - Computes total sleep duration.
* **Technical Constraints:** Ensure sleep duration calculation logic handles bedtime transitions past midnight.

---

## 5. EPIC: ADAPTIVE INTELLIGENCE & COACHING

### US-501: Dynamic TDEE Auto-Regulation
* **User Story:** As an intermediate athlete, I want the AI Coach to dynamically calculate my Total Daily Energy Expenditure (TDEE) based on my food logs and weight changes.
* **Acceptance Criteria:**
  - Analyzes daily calorie ingestion alongside moving average weight trends over rolling 14-day windows.
  - Recalculates estimated TDEE weekly.
* **Technical Constraints:** TDEE calculation logic is handled by a background service process.

### US-502: Interactive Biomechanical Chat
* **User Story:** As a user, I want to ask training or nutrition questions in a chat interface, so that I can receive advice based on my personal health metrics.
* **Acceptance Criteria:**
  - Chat interface streams answers to the screen in real time.
  - Contextual awareness includes the user's active goals, weight history, and current training routine.
* **Technical Constraints:** Implement Retrieval-Augmented Generation (RAG) using user database records to construct LLM prompts.

---

## 6. EPIC: CALENDAR & HISTORICAL VIEWS

### US-601: Interactive Schedule Calendar
* **User Story:** As a user, I want to review my training and nutrition logs on a calendar so that I can track my consistency.
* **Acceptance Criteria:**
  - Calendar displays daily workout completion status and macronutrient targets.
  - Allows dragging and dropping scheduled workouts to adjust execution dates.
* **Technical Constraints:** Calendar UI utilizes clean, virtualized lists on mobile viewports to prevent memory lag.

---

## 7. EPIC: ANALYTICS, PRs & REWARDS

### US-701: Volume Load and 1RM Analytics
* **User Story:** As an advanced lifter, I want to view training charts showing volume load and 1RM trends by exercise.
* **Acceptance Criteria:**
  - Chart page displays interactive graphs.
  - Filters let users select timeframes (30 Days, 3 Months, All Time) and specific exercises.
* **Technical Constraints:** Graph components leverage `Recharts` and are optimized to render on both desktop and mobile viewports.

### US-702: Personal Record Alerts
* **User Story:** As an active lifter, I want to receive real-time notifications when I achieve a personal record.
* **Acceptance Criteria:**
  - Triggers success indicators (e.g., confetti) immediately on checking a PR set.
  - Logs the record entry automatically to the user's PR database.
* **Technical Constraints:** Handled in workout validation pipelines before saving logs.

### US-703: Gamified Achievement Badges
* **User Story:** As a beginner, I want to unlock badges as I achieve fitness milestones, so that I can stay motivated.
* **Acceptance Criteria:**
  - Unlocked achievements display a congratulatory notification.
  - Displays all unlocked and locked badges in the user profile area.
* **Technical Constraints:** Achievements are written to user profiles via single-write database triggers.

---

## 8. EPIC: SYSTEM AUDIT & MODERATION

### US-801: Admin Food Database Moderation Queue
* **User Story:** As a system administrator, I want to review user-submitted food items, so that I can maintain database quality.
* **Acceptance Criteria:**
  - Admin panel lists pending food and barcode submissions.
  - Admin can approve, reject, or edit nutrient metrics before items are published globally.
* **Technical Constraints:** Access is restricted to users with authenticated `ADMIN` roles.

---
*End of Document: 03_USER_STORIES.md — Proceed to 04_BUSINESS_RULES.md*
