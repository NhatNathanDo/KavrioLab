# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 11. GLOBAL DESIGN SYSTEM & TOKENS SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document outlines the core tokens, layout variables, and custom theme properties used across the KavrioLab design system.

---

## 1. SEMANTIC COLOR SYSTEMS (TAILWIND CSS METRICS)

KavrioLab strictly uses monochromatic, low-saturation slate and zinc tones to create a premium, minimal user interface.

```
+---------------------------------------------------------------------------------------------------+
|                                      SEMANTIC COLOR PALETTE                                       |
+---------------------------------------------------------------------------------------------------+
|  MODE       |  BACKGROUND      |  FOREGROUND      |  CARD / POPUP    |  BORDER                    |
|  Light Mode |  #ffffff         |  #09090b (Zinc)  |  #f4f4f5 (Zinc)  |  #e4e4e7 (Zinc-200)        |
|  Dark Mode  |  #09090b (Black) |  #fafafa (White) |  #18181b (Zinc)  |  #27272a (Zinc-800)        |
+---------------------------------------------------------------------------------------------------+
```

### 1.1 Root CSS Variable Definitions
```css
@theme {
  --color-background: #ffffff;
  --color-foreground: #09090b;

  --color-card: #ffffff;
  --color-card-foreground: #09090b;

  --color-popover: #ffffff;
  --color-popover-foreground: #09090b;

  --color-primary: #18181b;
  --color-primary-foreground: #fafafa;

  --color-secondary: #f4f4f5;
  --color-secondary-foreground: #18181b;

  --color-muted: #f4f4f5;
  --color-muted-foreground: #71717a;

  --color-accent: #f4f4f5;
  --color-accent-foreground: #18181b;

  --color-destructive: #ef4444;
  --color-destructive-foreground: #fafafa;

  --color-border: #e4e4e7;
  --color-input: #e4e4e7;
  --color-ring: #18181b;
}

.dark {
  --color-background: #09090b;
  --color-foreground: #fafafa;

  --color-card: #09090b;
  --color-card-foreground: #fafafa;

  --color-popover: #09090b;
  --color-popover-foreground: #fafafa;

  --color-primary: #fafafa;
  --color-primary-foreground: #18181b;

  --color-secondary: #27272a;
  --color-secondary-foreground: #fafafa;

  --color-muted: #27272a;
  --color-muted-foreground: #a1a1aa;

  --color-accent: #27272a;
  --color-accent-foreground: #fafafa;

  --color-destructive: #7f1d1d;
  --color-destructive-foreground: #fafafa;

  --color-border: #27272a;
  --color-input: #27272a;
  --color-ring: #d4d4d8;
}
```

---

## 2. TYPOGRAPHY SCALE

KavrioLab uses standard sans-serif system fonts: `Geist` or `Inter` for general copy, and `Geist Mono` for logs, numbers, weights, and rep counts.

| Class Name | Font Size | Line Height | Letter Spacing | Font Weights |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | $12\text{px}$ ($0.75\text{rem}$) | $16\text{px}$ | $+0.01\text{em}$ | `Regular (400)` |
| `text-sm` | $14\text{px}$ ($0.875\text{rem}$) | $20\text{px}$ | $\pm 0$ | `Regular (400)`, `Medium (500)` |
| `text-base` | $16\text{px}$ ($1.0\text{rem}$) | $24\text{px}$ | $-0.011\text{em}$ | `Regular (400)`, `Medium (500)` |
| `text-lg` | $18\text{px}$ ($1.125\text{rem}$) | $28\text{px}$ | $-0.018\text{em}$ | `Medium (500)`, `SemiBold (660)` |
| `text-xl` | $20\text{px}$ ($1.25\text{rem}$) | $28\text{px}$ | $-0.022\text{em}$ | `SemiBold (660)` |
| `text-2xl` | $24\text{px}$ ($1.5\text{rem}$) | $32\text{px}$ | $-0.025\text{em}$ | `SemiBold (660)`, `Bold (700)` |

---

## 3. SPACING & LAYOUT SCALES
The design system follows a 4px grid system:

- **Component Padding (Internal):** `p-2` ($8\text{px}$), `p-3` ($12\text{px}$), `p-4` ($16\text{px}$).
- **Section Spacing (Margins):** `gap-4` ($16\text{px}$), `gap-6` ($24\text{px}$), `gap-8` ($32\text{px}$).
- **Border Radii:**
  - Standard Cards: `rounded-lg` ($8\text{px}$)
  - Buttons & Inputs: `rounded-md` ($6\text{px}$)
  - Avatar & Badges: `rounded-full` ($9999\text{px}$)

---

## 4. DESIGN RULES & VISUAL COMPLIANCE

- **Grid Lines:** Layout grids must use thin $1\text{px}$ borders (`border-border`) rather than heavy shadow styling.
- **Visual Elevation:** Cards must be flat by default. Subtle drop shadows (`shadow-sm`) are permitted only on floating elements like context menus and modals.

---
*End of Document: 11_DESIGN_SYSTEM.md — Proceed to 12_DEVELOPMENT_RULES.md*
