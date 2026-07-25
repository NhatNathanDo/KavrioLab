# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 09. AI SERVICE PIPELINE & MODEL SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the artificial intelligence components of KavrioLab, including the computer vision food recognition parser and the context-aware conversational AI coach.

---

## 1. MULTIMODAL COMPUTER VISION FOOD ANALYZER

### 1.1 Model Pipeline Architecture
For food plate photo recognition, KavrioLab leverages multimodal LLMs (e.g. `Gemini 1.5 Pro` or `GPT-4o`) via the Vercel AI SDK.

```
+---------------------------------------------------------------------------------------------------+
|                                     AI FOOD ANALYSIS FLOW                                         |
+---------------------------------------------------------------------------------------------------+
|  [Image Upload] -> [Vercel Blob URL] -> [Construct System Context] -> [Execute Structured JSON API]|
|                                                                                                   |
|  Output Validation check: Ensure the response matches the Zod schema before parsing food targets |
+---------------------------------------------------------------------------------------------------+
```

### 1.2 System Prompt Configuration
```
You are a highly accurate nutritional analysis assistant. 
Your task is to analyze the provided meal image and return a structured JSON response.

Strict Rules:
1. Identify all visible food items in the image.
2. Estimate the mass in grams for each identified food item.
3. Compute macronutrients (Protein, Carbs, Fat) based on official database averages.
4. Calculate total calories: Calories = (Protein * 4) + (Carbs * 4) + (Fat * 9).
5. Output response strictly in JSON format matching the schema requested.
```

### 1.3 Target Output JSON Schema
```json
{
  "type": "object",
  "properties": {
    "mealDescription": { "type": "string" },
    "confidenceScore": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foodName": { "type": "string" },
          "estimatedWeightGrams": { "type": "number" },
          "protein": { "type": "number" },
          "carbs": { "type": "number" },
          "fat": { "type": "number" }
        },
        "required": ["foodName", "estimatedWeightGrams", "protein", "carbs", "fat"]
      }
    }
  },
  "required": ["mealDescription", "confidenceScore", "components"]
}
```

---

## 2. CHAT COACH & CONTEXT EMBEDDING (RAG)

The KavrioLab AI Coach utilizes a Retrieval-Augmented Generation (RAG) architecture to personalize recommendations based on historical user metrics stored in PostgreSQL.

```
+---------------------------------------------------------------------------------------------------+
|                                        AI COACH RAG FLOW                                          |
+---------------------------------------------------------------------------------------------------+
|  [User Query] -> [Fetch Historical Context (Weight, Macros, Workouts)] -> [Assemble Prompt]        |
|                                                                                                   |
|  -> [LLM Generation with context parameters] -> [Stream Response to client page]                  |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Context Prompt Assembly Template
```
You are the KavrioLab AI Coach, an expert fitness instructor and sports dietitian.
You are chatting with a user. Use their historical performance data below to tailor your advice.

USER CONTEXT:
- Name: {{userProfile.name}}
- Goal: {{userProfile.fitnessGoal}}
- Current Weight: {{weightTrend.currentTrendKg}} kg (7-day average)
- Weight Change: {{weightTrend.weeklyDeltaKg}} kg last week
- Target Intake: {{nutritionTarget.calories}} kcal (P: {{nutritionTarget.protein}}g, C: {{nutritionTarget.carbs}}g, F: {{nutritionTarget.fat}}g)
- Average Sleep Duration: {{sleepHistory.averageHours}} hours

Active Training Program:
{{activeProgram.summary}}

User Query: "{{userQuery}}"
```

### 2.2 System Safety Constraints & Guardrails
- **Medical Disclaimer:** If queries request clinical diagnosis or treatment for chronic illness, prepend response with: `"I am an AI fitness assistant, not a medical doctor..."` and direct the user to consult a healthcare provider.
- **Workout Safety:** Exclude training movements that overlap with user-indicated joint injuries (e.g. if shoulder injury is flagged, do not suggest barbell shoulder press variations).

---
*End of Document: 09_AI_SPECIFICATION.md — Proceed to 10_UI_GUIDELINES.md*
