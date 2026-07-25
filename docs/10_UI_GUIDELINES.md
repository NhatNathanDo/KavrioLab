# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 10. UI/UX INTERACTION & MOTION GUIDELINES

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document defines user interface patterns, responsive grid allocations, keyboard accessibility rules, and motion curves for the KavrioLab platform.

---

## 1. RESPONSIVE LAYOUT MATRIX & GRID BREAKPOINTS

KavrioLab uses dynamic, content-aware layout structures optimized for two primary environments: high-friction commercial gym floors (mobile-first) and quiet planning desks (desktop-first).

| Breakpoint Name | Viewport Target | UI Structural Behavior | Primary Viewports |
| :--- | :--- | :--- | :--- |
| `xs` | $<640\text{px}$ | Mobile Portrait. Bottom navigation sheet layout. Workout logging uses a single-pane vertical layout with large touch targets ($48\text{px} \times 48\text{px}$). | 390x844 (iPhone 15) |
| `sm` | $640\text{px} - 768\text{px}$ | Mobile Landscape / Small Tablets. Sidebar layout collapses; dashboard grids adjust to 2 columns. | 768x1024 (iPad Mini) |
| `md` | $768\text{px} - 1024\text{px}$ | Standard Tablets. Floating workout widgets anchor to the bottom right of the screen. | 1024x1366 (iPad Pro) |
| `lg` | $1024\text{px} - 1280\text{px}$ | Laptops. Split-pane layout: Exercise list on the left, active execution panel on the right. | 1280x800 (MacBook Air) |
| `xl` | $>1280\text{px}$ | High-Resolution Desktops. Multi-column dashboard: Analytics charts, weekly activity calendars, and social workout feeds load side-by-side. | 1920x1080 (Pro Display) |

---

## 2. INTERACTION STATE SPECIFICATIONS

All interactive elements must support five distinct visual states to ensure clear feedback:

```
+---------------------------------------------------------------------------------------------------+
|                                     ELEMENT STATE LIFECYCLE                                       |
+---------------------------------------------------------------------------------------------------+
|  [1. DEFAULT]  ->  [2. HOVER]  ->  [3. ACTIVE]  ->  [4. FOCUS]  ->  [5. DISABLED]                 |
|  Standard zinc     Scale slightly      Opacity shifts   Focus ring      Opacity drops to 40%,    |
|  border outline    (1.02x scale)       to 90%           (zinc ring-2)   pointer-events: none     |
+---------------------------------------------------------------------------------------------------+
```

- **Default State:** Clean, flat background with zinc-200 (light mode) or zinc-800 (dark mode) borders.
- **Hover State:** Border transitions to zinc-400 (light) or zinc-600 (dark). Background gains a subtle highlight. Triggered with a $150\text{ms}$ ease transition.
- **Active (Pressed) State:** Background shifts to a darker tone, and elements scale down slightly ($0.98\text{x}$) to simulate a physical press.
- **Focus State (`focus-visible`):** Apply a distinct $2\text{px}$ outline offset ring. Native browser focus outlines must be disabled.
- **Disabled State:** Opacity falls to $40\%$, cursor shifts to `not-allowed`, and pointer events are disabled.

---

## 3. MOTION & ANIMATION SPECIFICATIONS

Animations are built using Framer Motion. They must feel responsive and functional, rather than decorative.

### 3.1 Timing & Easing Curves
- **Standard Transition Duration:** $200\text{ms}$
- **Micro-interactions (e.g. checkmark checks, switch toggles):** $150\text{ms}$
- **Large Modals / Page transitions:** $300\text{ms}$
- **Aesthetic Easing Function (Linear/Apple inspired):** `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-smooth deceleration)

### 3.2 Standard Motion Presets
```javascript
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
};

export const modalAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
};
```

---

## 4. ACCESSIBILITY (WCAG 2.1 AA COMPLIANCE)

- **Color Contrast:** Text-to-background contrast ratios must remain above $4.5:1$ (light mode) and $7:1$ (dark mode).
- **Keyboard Traps:** All dialogs and drawer components must utilize `@radix-ui/react-dialog` to enforce focus traps and close safely on pressing the `Escape` key.
- **ARIA Labeling:** Interactive elements like checking sets must include explicit screen reader indicators: `<button aria-label="Mark set 1 as completed" ... />`.

---
*End of Document: 10_UI_GUIDELINES.md — Proceed to 11_DESIGN_SYSTEM.md*
