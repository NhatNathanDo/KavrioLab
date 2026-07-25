# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 19. ANALYTICS & TELEMETRY PROTOCOLS

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details user event logging schemas, analytical processing operations, and data aggregation routines for KavrioLab.

---

## 1. USER EVENT TELEMETRY SCHEMA

To track feature utilization and system performance, client-side actions and API requests trigger structured telemetry payloads:

```
+---------------------------------------------------------------------------------------------------+
|                                      EVENT LOGGER FLOW                                            |
+---------------------------------------------------------------------------------------------------+
|  [Action Trigger] -> [Collect Device Metadata] -> [Dispatch to Edge Queue] -> [Save to DB / Warehouse]|
+---------------------------------------------------------------------------------------------------+
```

### 1.1 Standard Event Payload Attributes
All logged events must include the following properties:
- `eventId`: `UUID`
- `userId`: `UUID` (null if anonymous)
- `eventType`: `VARCHAR(100)`
- `timestamp`: `TIMESTAMP (UTC)`
- `deviceType`: `Enum(MOBILE_WEB, TABLET_WEB, DESKTOP_WEB)`
- `payload`: `JSONB`

---

## 2. EVENT CATEGORY REGISTRATION

| Event Type Name | Trigger Occurs | Payload Details |
| :--- | :--- | :--- |
| `workout_started` | User starts a training template | `{ templateId: "UUID", isCustom: true }` |
| `workout_completed` | User clicks finish workout and saves logs | `{ totalDurationMin: 62, totalVolumeKg: 8400, prsCount: 2 }` |
| `food_logged` | Food entry added to meal logs | `{ foodItemId: "UUID", servingSizeG: 150, inputMethod: "BARCODE_SCAN" }` |
| `ai_coach_query` | User submits query to the chatbot | `{ queryLengthTokens: 45, contextDaysInjected: 14 }` |
| `subscription_upgraded`| Checkout completed inside Stripe | `{ stripeSubscriptionId: "sub_123", pricingTier: "PREMIUM" }` |

---

## 3. DAILY AGGREGATION CRON LOGIC

To optimize chart performance on the client, user metrics are pre-aggregated daily at 2:00 AM UTC.

```sql
-- Aggregates volume by muscle group for fast dashboard rendering
INSERT INTO "MuscleGroupDailyVolume" ("id", "userId", "date", "muscleGroup", "totalVolumeKg")
SELECT 
  gen_random_uuid(),
  w."userId",
  w."completedAt"::date,
  e."primaryMuscle",
  SUM(s."weightKg" * s."repsCompleted")
FROM "WorkoutLog" w
JOIN "WorkoutLogExercise" we ON we."workoutLogId" = w."id"
JOIN "WorkoutLogSet" s ON s."workoutLogExerciseId" = we."id"
JOIN "Exercise" e ON e."id" = we."exerciseId"
WHERE w."completedAt" >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY w."userId", w."completedAt"::date, e."primaryMuscle"
ON CONFLICT ("userId", "date", "muscleGroup") DO UPDATE 
SET "totalVolumeKg" = EXCLUDED."totalVolumeKg";
```

---

## 4. PRIVACY PROTECTION & OPT-OUT CONTROLS

- **Anonymization:** Strip IP addresses and exact device identifier strings from telemetry tables; store regional locations only.
- **Opt-Out Toggle:** Users can select "Disable Usage Telemetry" in settings, blocking non-essential event dispatch pipelines.

---
*End of Document: 19_ANALYTICS.md — Proceed to 20_FEATURE_BACKLOG.md*
