# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 04. BUSINESS RULES & ALGORITHMIC SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the mathematical models, validation pipelines, and business logic governing the KavrioLab platform. It provides developers and AI agents with precise implementation constraints for database schemas and service classes.

---

## 1. NUTRITIONAL & ENERGETIC FORMULAS

### 1.1 Basal Metabolic Rate (BMR) Estimation
The system must calculate BMR using the Mifflin-St Jeor equation. If gender identity is not specified, default calculations use the female coefficient as a conservative baseline.

$$\text{BMR (Men)} = 10 \cdot W + 6.25 \cdot H - 5 \cdot A + 5$$
$$\text{BMR (Women)} = 10 \cdot W + 6.25 \cdot H - 5 \cdot A - 161$$

Where:
- $W$ = Body weight in kilograms (kg)
- $H$ = Stature height in centimeters (cm)
- $A$ = Age in years (calculated from UTC birthdate)

### 1.2 Activity Level Multipliers
Total Daily Energy Expenditure (TDEE) is calculated by applying an activity multiplier to the computed BMR:

$$\text{TDEE}_{\text{baseline}} = \text{BMR} \cdot M_{\text{activity}}$$

| Activity Tier | Description | Multiplier ($M_{\text{activity}}$) |
| :--- | :--- | :--- |
| `SEDENTARY` | Little or no exercise, desk job | $1.200$ |
| `LIGHTLY_ACTIVE` | Light exercise 1–3 days/week | $1.375$ |
| `MODERATELY_ACTIVE` | Moderate exercise 3–5 days/week | $1.550$ |
| `VERY_ACTIVE` | Hard exercise 6–7 days/week | $1.725$ |
| `EXTRA_ACTIVE` | Very hard daily exercise & physical job | $1.900$ |

### 1.3 Goal-Based Target Caloric Adjustments
To determine daily target calories, apply adjustments to baseline TDEE based on the user's selected goal:

| Goal Identifier | Target Caloric Adjustment | Maximum Weekly Rate of Change Limit |
| :--- | :--- | :--- |
| `AGGRESSIVE_LOSS` | $\text{TDEE} - 750\text{ kcal}$ | $1.0\%\text{ of total body weight}$ |
| `MODERATE_LOSS` | $\text{TDEE} - 500\text{ kcal}$ | $0.7\%\text{ of total body weight}$ |
| `MAINTENANCE` | $\text{TDEE} \pm 0\text{ kcal}$ | $0.0\%\text{ of total body weight}$ |
| `LEAN_GAIN` | $\text{TDEE} + 250\text{ kcal}$ | $0.25\%\text{ of total body weight}$ |
| `AGGRESSIVE_GAIN` | $\text{TDEE} + 500\text{ kcal}$ | $0.5\%\text{ of total body weight}$ |

---

## 2. DYNAMIC NUTRITION EXPENDITURE ALGORITHM
KavrioLab implements a self-correcting TDEE algorithm inspired by MacroFactor. This algorithm adjusts user targets weekly by comparing actual caloric intake with changes in body weight trends.

```
+---------------------------------------------------------------------------------------------------+
|                                  DYNAMIC EXPENDITURE ALGORITHM                                    |
+---------------------------------------------------------------------------------------------------+
|  1. COMPUTE WEIGHT DELTA     |  2. COMPUTE ENERGY EQUIVALENT |  3. COMPUTE DYNAMIC EXPENDITURE   |
|  ΔW = Weight_End - Weight_Beg|  E_delta = ΔW * 7700 kcal     |  TDEE_dyn = Intake_avg - E_delta  |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Caloric Density Coefficients
- **Fats:** $9.0\text{ kcal/gram}$
- **Proteins:** $4.0\text{ kcal/gram}$
- **Carbohydrates:** $4.0\text{ kcal/gram}$
- **Alcohol:** $7.0\text{ kcal/gram}$
- **Water Density Constant:** $1.000\text{ g/ml}$

### 2.2 Caloric Reconciliation Constraint (Macro Sum Rule)
- To eliminate discrepancy between manufacturer food label rounding and mathematical calculation, actual logged calories for any meal or day must be computed using:
  $$\text{Calories}_{\text{logged}} = (P \cdot 4) + (C \cdot 4) + (F \cdot 9) + (Alc \cdot 7)$$
- If the calculated value differs from the food label's explicitly stated calories by $> 5\%$, the system displays the mathematically calculated value in logging screens, but stores both fields in the database for accuracy.

### 2.3 TDEE Rolling Integration Window
- The dynamic expenditure algorithm checks a moving **14-day historical window** of daily body weight values and actual logged caloric intake.
- A minimum of **10 complete logging days** (containing weight and $>1000\text{ kcal}$ logged) within the 14-day window is required to trigger a weekly TDEE target update. If threshold is not met, the coach retains the previous target to prevent mathematical noise.

---

## 3. WORKOUT ENGINE & PHYSIOLOGICAL METRICS

### 3.1 Estimated 1-Rep Max (1RM) Formulas
To calculate 1RM from submaximal lifts, the system supports both the Epley and Brzycki equations:

$$\text{1RM}_{\text{Epley}} = W \cdot \left(1 + \frac{R}{30}\right)$$
$$\text{1RM}_{\text{Brzycki}} = \frac{W}{1.0278 - 0.0278 \cdot R}$$

Where:
- $W$ = Weight lifted (must be $> 0$)
- $R$ = Number of repetitions completed (validated between $1$ and $30$)

### 3.2 Exponential Moving Average (EMA) for Weight Trends
To smooth out daily fluctuations caused by sodium and hydration levels, KavrioLab calculates a daily weight trend using an exponential moving average:

$$\text{Trend}_t = \alpha \cdot \text{Weight}_t + (1 - \alpha) \cdot \text{Trend}_{t-1}$$

Where:
- $\alpha = 0.1428$ (representing $\frac{1}{7}$, corresponding to a 7-day smoothing window).

---

## 4. SUBSCRIPTION TIERS & PLATFORM LIMITATIONS

KavrioLab enforces strict access limits based on the user's active billing tier:

| Feature / Limit Vector | Free Tier | Premium Tier |
| :--- | :--- | :--- |
| **Max Custom Routines** | $3$ templates | Unlimited |
| **Max Training Programs** | $1$ program assignment | Unlimited |
| **Historical Logs Window** | 30 days history retention | Unlimited / Lifetime |
| **AI Coach Interactions** | Disabled | Unlimited (rate-limited) |
| **AI Food Recognition** | $3$ photo scans / month | Unlimited |
| **Offline Sync Cache** | Single device | Multi-device sync |
| **Progress Photo Storage** | Up to $10$ photos | Unlimited |

---
*End of Document: 04_BUSINESS_RULES.md — Proceed to 05_ARCHITECTURE.md*
