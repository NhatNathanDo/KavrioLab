# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 02. USER PERSONAS SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document defines the core user personas for KavrioLab. It details user backgrounds, technological preferences, workflows, and technical design considerations to guide the development of target UI/UX interfaces and database interactions.

---

## 1. THE NOVICE / BEGINNER

### 1.1 Persona Profile: Alex Miller
* **Age:** 24  
* **Occupation:** Junior Graphic Designer  
* **Fitness Level:** Novice  
* **Environment:** Home & Basic Apartment Gym  
* **Primary Goal:** Establish training habits and lose 5kg of body fat.  

### 1.2 Core Pain Points
- Overwhelmed by complex fitness terminology (e.g., RPE, dynamic periodization, macronutrient ratios).
- Struggles to perform exercises with correct form, leading to a fear of injury.
- Low initial motivation; easily discouraged by a lack of immediate visual progress.

### 1.3 Key KavrioLab Features Used
- AI Onboarding wizard.
- Pre-built workout templates.
- Exercise library instructional videos.
- Hydration widget and simple habit tracker.

### 1.4 Technical Accommodations & UX Map
- Avoid complex jargon on the primary UI; provide optional tooltips explaining terms like "RPE" and "1RM".
- Implement progressive disclosures: hide advanced logging features (such as myo-reps and custom supersets) behind default settings toggles.
- Optimize the UI for immediate confirmation: trigger motivational notifications on completion of onboarding or first logged workouts.

---

## 2. THE INTERMEDIATE ATHLETE

### 2.2 Persona Profile: Jordan Carter
* **Age:** 29  
* **Occupation:** Sales Representative  
* **Fitness Level:** Intermediate  
* **Environment:** Commercial Gym  
* **Primary Goal:** Break through strength plateaus and optimize physique.  

### 2.2 Core Pain Points
- Progress tracking is scattered across spreadsheets and notes apps.
- Struggles to calculate progressive overload schedules manually.
- Needs to manage caloric intake to match body weight changes.

### 2.3 Key KavrioLab Features Used
- Workout planner and exercise logging.
- AI Coach recommendations for progressive overload.
- Weight trends tracking using 7-day EMA algorithms.
- Custom habit streak logs.

### 2.4 Technical Accommodations & UX Map
- Provide easy toggles to duplicate the previous week's workout logs.
- Deliver automated progressive overload suggestions at the start of a workout.
- Ensure graphs display calorie trends overlaid against weight changes.

---

## 3. THE ADVANCED LIFTER

### 3.1 Persona Profile: Marcus Thorne
* **Age:** 34  
* **Occupation:** Systems Engineer  
* **Fitness Level:** Advanced  
* **Environment:** Fully Equipped Strength Gym  
* **Primary Goal:** Optimize training efficiency and maximize hypertrophy.  

### 3.2 Core Pain Points
- Logging systems lack precision: unable to log RPE/RIR easily.
- Cannot configure complex supersets, drop sets, or myo-reps.
- Data export options are limited, preventing custom spreadsheet analysis.

### 3.3 Key KavrioLab Features Used
- Advanced Workout Engine with RPE/RIR options.
- Custom program planner.
- Granular volume distribution graphs.
- JSON/CSV export tool.

### 3.4 Technical Accommodations & UX Map
- Design the set table logging interface to support fast keyboard and tab entry.
- Implement comprehensive validation checks for advanced set types.
- Provide a clean data export API returning structured JSON configurations of workout histories.

---

## 4. THE PHYSIQUE COMPETITOR / BODYBUILDER

### 4.1 Persona Profile: Elena Rostova
* **Age:** 27  
* **Occupation:** Content Creator & Fitness Coach  
* **Fitness Level:** Advanced  
* **Environment:** Commercial Gym & Personal Training Studio  
* **Primary Goal:** Track exact body composition metrics and macronutrient breakdowns.  

### 4.2 Core Pain Points
- Meal logging is slow, discouraging consistent food logs.
- Standard progress photo libraries get mixed with general phone camera rolls.
- Need to keep track of precise body circumference changes.

### 4.3 Key KavrioLab Features Used
- AI Food Recognition.
- Nutrition log with verified food database.
- Private progress photo vault with comparison tools.
- Body measurement tracker.

### 4.4 Technical Accommodations & UX Map
- Optimize image processing pipelines for photo uploads to Vercel Blob.
- Secure photo vaults using user-specific database filters.
- Maintain measurement history tables that support rapid unit conversions.

---

## 5. THE STRENGTH / POWERLIFTER

### 5.1 Persona Profile: David Vance
* **Age:** 31  
* **Occupation:** Financial Analyst  
* **Fitness Level:** Advanced  
* **Environment:** Powerlifting Club  
* **Primary Goal:** Maximize 1RM for Squat, Bench Press, and Deadlift.  

### 5.2 Core Pain Points
- Workout apps lack precise plate calculator helpers.
- 1-Rep Max projections are often inaccurate or lack choice of calculation formulas.
- Short rest timers do not accommodate long rest intervals (e.g., 3-5 minutes) needed for heavy sets.

### 5.3 Key KavrioLab Features Used
- Barbell Plate Calculator utility.
- Custom rest timers with sound triggers.
- 1-Rep Max estimation analytics.
- PR tracking metrics.

### 5.4 Technical Accommodations & UX Map
- Support plate calculation calculations configures for different bar weights (15kg, 20kg, 25kg).
- Provide customizable rest timers that run reliably as background notifications.
- Expose calculations settings, allowing users to choose between Epley and Brzycki 1RM formulas.

---

## 6. THE HOME WORKOUT USER

### 6.1 Persona Profile: Sarah Jenkins
* **Age:** 36  
* **Occupation:** Freelance Architect  
* **Fitness Level:** Intermediate  
* **Environment:** Home Living Room  
* **Primary Goal:** Maintain health and lean mass with limited equipment.  

### 6.2 Core Pain Points
- General fitness apps recommend exercises requiring machines not available at home.
- Hard to find alternative exercises when equipment is limited.
- Workouts can feel repetitive without access to commercial gyms.

### 6.3 Key KavrioLab Features Used
- Onboarding equipment checklist filters.
- Exercise library filtered by equipment type.
- AI Coach exercise substitution suggestions.
- Calendar routine planner.

### 6.4 Technical Accommodations & UX Map
- Implement strict database filtering query constraints in the exercise library based on user equipment profiles.
- Design the AI Coach substitution prompt to suggest variations based on the user's available equipment.

---

## 7. THE PEAK GYM USER

### 7.1 Persona Profile: Liam O'Connor
* **Age:** 22  
* **Occupation:** University Student  
* **Fitness Level:** Intermediate  
* **Environment:** Crowded University Gym  
* **Primary Goal:** Complete scheduled workouts quickly without delays from occupied machines.  

### 7.2 Core Pain Points
- Poor internet connection in gym basements halts standard cloud-based logging.
- Target equipment is frequently occupied, requiring quick on-the-fly substitutions.
- Slow app interfaces add friction during short rest periods.

### 7.3 Key KavrioLab Features Used
- Offline Support and PWA functionality.
- Fast exercise swap tools.
- Optimistic UI updates.

### 7.4 Technical Accommodations & UX Map
- Enable offline workout logging with local IndexedDB caches.
- Provide a single-tap exercise swap modal during active workouts.
- Optimize bundle sizes and load assets progressively to keep the UI snappy under low-bandwidth network conditions.

---
*End of Document: 02_USER_PERSONAS.md — Proceed to 03_USER_STORIES.md*
