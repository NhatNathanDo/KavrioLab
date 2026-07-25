# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 08. API CONTRACT & ROUTING SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the REST API specifications for external interfaces and the RPC Server Action configurations for internal presentation queries within KavrioLab.

---

## 1. REST API STANDARD STANDARDS

### 1.1 Global Endpoints
- **Production Host:** `https://api.kavriolab.com/v1`
- **Sandbox Host:** `https://sandbox-api.kavriolab.com/v1`

### 1.2 Required Request Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
Accept: application/json
X-App-Version: 1.0.0
```

### 1.3 Global Error Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided request body contained invalid values.",
    "details": [
      {
        "field": "weightKg",
        "issue": "Weight must be a positive decimal value."
      }
    ]
  },
  "timestamp": "2026-07-10T15:29:57Z"
}
```

---

## 2. API ENDPOINTS REFERENCE

### 2.1 GET `/workouts/logs`
- **Purpose:** Retrieve a paginated list of the user's completed workout logs.
- **Query Parameters:**
  - `page`: `INTEGER` (Default: `1`)
  - `limit`: `INTEGER` (Default: `20`)
  - `startDate`: `ISO-8601 Date` (Optional)
  - `endDate`: `ISO-8601 Date` (Optional)
- **Response Payloads (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "a02d4493-21c6-4318-b258-45e0d49fb49c",
        "name": "Push Day A",
        "startedAt": "2026-07-10T08:00:00Z",
        "completedAt": "2026-07-10T09:15:00Z",
        "durationMinutes": 75,
        "exercisesCount": 3
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 87
    }
  }
}
```

### 2.2 POST `/workouts/logs`
- **Purpose:** Create or save a new workout log.
- **Request Body Validation Schema:**
```json
{
  "name": "Push Day A",
  "startedAt": "2026-07-10T08:00:00Z",
  "completedAt": "2026-07-10T09:15:00Z",
  "notes": "Felt strong on bench press today.",
  "exercises": [
    {
      "exerciseId": "8f3c7e49-8c01-4475-b6bb-35d29035f299",
      "orderIndex": 0,
      "sets": [
        {
          "setType": "NORMAL",
          "weightKg": 100.0,
          "repsCompleted": 5,
          "rpe": 9.0
        }
      ]
    }
  ]
}
```
- **Response Payloads (`211 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "a02d4493-21c6-4318-b258-45e0d49fb49c",
    "savedRecords": 1
  }
}
```

### 2.3 GET `/food/search`
- **Purpose:** Fuzzy search foods across localized databases and external USDA/OpenFoodFacts logs.
- **Query Parameters:**
  - `query`: `STRING` (Not Null, Minimum 2 characters)
  - `verifiedOnly`: `BOOLEAN` (Default: `false`)
- **Response Payloads (`200 OK`):**
```json
{
  "success": true,
  "results": [
    {
      "id": "e912c982-f472-4d22-b529-6c5d14dfb02d",
      "name": "Quick Oats",
      "brand": "Quaker",
      "calories": 380,
      "protein": 13.0,
      "carbs": 68.0,
      "fat": 7.0,
      "verified": true
    }
  ]
}
```

### 2.4 POST `/nutrition/ai-scan`
- **Purpose:** Analyze photos of meals to estimate calories and macronutrients.
- **Request Body (Multipart Form):**
  - `image`: `Binary File` (JPEG, PNG, WebP up to 10MB)
- **Response Payloads (`200 OK`):**
```json
{
  "success": true,
  "aiEstimation": {
    "mealDescription": "Grilled chicken breast with cooked brown rice and steamed broccoli.",
    "confidenceScore": 0.88,
    "calculatedCalories": 420,
    "components": [
      {
        "foodName": "Chicken Breast",
        "estimatedWeightGrams": 150.0,
        "protein": 31.0,
        "carbs": 0.0,
        "fat": 3.6
      },
      {
        "foodName": "Brown Rice",
        "estimatedWeightGrams": 150.0,
        "protein": 4.0,
        "carbs": 35.0,
        "fat": 1.2
      }
    ]
  }
}
```

### 2.5 POST `/sync`
- **Purpose:** Reconcile offline mutations queued in IndexedDB.
- **Request Body:**
```json
{
  "mutations": [
    {
      "uuid": "439281a8-c290-4822-ba91-a18bf411624c",
      "action": "CREATE_SET_LOG",
      "timestamp": "2026-07-10T15:35:00Z",
      "payload": {
        "workoutLogExerciseId": "592bb8a0-2f3b-4899-b1d5-bc44d715a3bb",
        "weightKg": 120.0,
        "repsCompleted": 8,
        "rpe": 9.5
      }
    }
  ]
}
```
- **Response Payloads (`200 OK`):**
```json
{
  "success": true,
  "reconciledCount": 1,
  "conflicts": []
}
```

---

## 3. RESPONSE VALIDATION PIPELINE

- **Zod Enforcement:** All Server Action payloads undergo strict Zod schema validation before execution.
- **Rate Limiting:** Public API routes are limited to a maximum of 60 requests/minute per IP address (1000/minute for authenticated premium users) using Vercel edge rate limit configurations.

---
*End of Document: 08_API_SPECIFICATION.md — Proceed to 09_AI_SPECIFICATION.md*
