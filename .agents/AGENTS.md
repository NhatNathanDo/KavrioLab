# AI Rules

## AI Execution Directives
- **Documentation First:** Read every document under `docs/` before making any code changes to ensure all implementation details align.
- **Implementation Order:** `docs/15_ROADMAP.md` defines the strict milestone implementation order.
- **Database Decisions:** `docs/07_DATABASE.md` defines all database schemas, relationships, constraints, and migrations.
- **UI & UX Decisions:** `docs/10_UI_GUIDELINES.md` and `docs/11_DESIGN_SYSTEM.md` define every UI decision, interaction state, and animation transition.
- **Code Standards:** Never violate `docs/12_DEVELOPMENT_RULES.md`.
- **Dependencies:** Never introduce a new dependency without explicit justification and validation.
- **Zero Placeholders:** Never generate placeholder, mock, or "TODO" implementations. All generated code must be production-ready and fully functional.

## Core Technology Directives
- **UI Libraries:** Never use any UI component library other than shadcn/ui.
- **State Management:** Never use Redux. Use TanStack Query (React Query v5) for server state and lightweight Zustand for client-only state.
- **Next.js 15 App Router:** Always use Server Components unless client-side interaction (hooks, state, listeners) is required.
- **Type Safety & Code Hygiene:** Never use `any` unless absolutely necessary. Maintain strict type safety across the application.
- **Validation:** Always validate all user input and API payloads with Zod.
- **Database & Query Layer:** Always use Prisma. Never use raw SQL unless performance requires it. 

## Architectural & Design Patterns
- **Composition over Inheritance:** Prefer modular composition of components over inheritance.
- **Component Size Limits:** Keep components under 200 lines. If a component grows larger, extract sub-components or utilities.
- **Logic Extraction:** Extract reusable component logic and effects into custom React hooks.
- **Dry Rule:** Never duplicate code. Extract repeated patterns into shared utilities or helper services.

## Next.js 15 Coding Rules
- **Awaiting Params:** In Next.js 15, dynamic route parameters (e.g., `params`, `searchParams` in pages/layout/API routes) are promises. Always await them before accessing properties:
  ```typescript
  const { id } = await params;
  ```
- **Error Boundaries & Loaders:** Always generate `loading.tsx` and `error.tsx` for every route segment.
- **State Feedback Skeletons:** Always generate skeleton screens, empty states, and visual feedback for loading states.
- **Directives:** Explicitly add the `'use client'` directive at the absolute top of the file for client components.

## UI/UX & Accessibility (a11y)
- **Contrast & Elements:** Ensure compliance with WCAG 2.1 AA accessibility guidelines (appropriate ARIA labels, color contrasts, focus visible rings).
- **Interactive Focus:** Always keep keyboard navigation in mind. Dialogs, menus, and drawers must trap focus correctly using Radix UI primitives.

# Project Vision

KavrioLab is a premium, high-performance Fitness Operating System.
It is inspired by:
- **Apple Health** (readiness scores, physiological tracking metrics)
- **Hevy / Strong** (clean, quick-logging workout grids)
- **MacroFactor** (dynamic, algorithmic TDEE updates)
- **Linear / Vercel** (sleek dark/light mode interfaces, zinc palettes)
- **Notion** (clean information hierarchies)

The application should feel modern, calm, and premium.
Users should feel motivated, not overwhelmed.
Every screen should require as few clicks as possible.
Performance and speed are more important than visual effects.
The project must be production-ready from the beginning.
Never build demo-quality or placeholder code.

## Design System & Theme Rules (Apple Minimalism)
- **Contrast & Backgrounds:**
  - Light mode: use soft white background (`#fcfcfd`) with fine borders (`border-zinc-200`).
  - Dark mode: use soft matte dark gray background (`#0f0f11`, NOT pitch black) with fine dark borders (`border-zinc-900`).
- **Styling Rules:**
  - Rounding: cards and widgets must use standard `rounded-3xl` for a high-quality iOS/macOS look, buttons use `rounded-xl` or `rounded-full`.
  - Avoid glowing neon lights, cyber gradients, or saturated background colors. Use flat monochrome, gray, or zinc shades.
  - Keep typography thin or regular (SF Pro/Geist feel), tracking-tight on headers, and uppercase tracking-widest on tiny tags.

