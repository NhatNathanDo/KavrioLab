# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 12. CODING STANDARDS & DEVELOPMENT WORKFLOW

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the code rules, naming conventions, directory paradigms, git commit formats, and validation criteria for the KavrioLab codebase.

---

## 1. NAMING CONVENTIONS & DESIGN CODES

To maintain a consistent codebase across contributors and AI agents, all files and variables must follow these naming patterns:

| Target Component | Case Style | Example Pattern |
| :--- | :--- | :--- |
| **Directory & Folder Layouts** | `kebab-case` | `src/app/workout-engine/` |
| **Client/Server React Components** | `PascalCase` | `ActiveSetTracker.tsx` |
| **Custom React Hooks** | `camelCase` (prefixed with `use`) | `usePlateCalculator.ts` |
| **Route Path Directories** | `lowercase-slug` / brackets | `src/app/workouts/[id]/page.tsx` |
| **Zod Validation Schemas** | `camelCase` (suffixed with `Schema`) | `workoutLogSchema` |
| **TypeScript Types & Interfaces** | `PascalCase` | `WorkoutSetPayload` |
| **Database Tables (Prisma)** | `PascalCase` | `DailyNutritionLog` |
| **Database Fields (Prisma)** | `camelCase` | `targetWeightKg` |

---

## 2. PRISMA DATABASE RULES & CONSTRAINTS

- **Strict UUID Requirement:** Never use auto-incrementing integer primary keys (`Int @id @default(autoincrement())`). All tables must use UUID primary keys: `id String @id @default(uuid()) @db.Uuid`.
- **Foreign Key Definitions:** Explicitly declare foreign key actions using `onDelete: Cascade` or `onDelete: Restrict` where appropriate.
- **Index Management:** Every query selector inside database services must be backed by a corresponding database index defined in `schema.prisma`.

---

## 3. GIT BRANCHING & COMMIT CONVENTIONS

### 3.1 Trunk-Based Branch Strategy
- **`main`:** Production-stable branch. Changes are merged only via pull requests from reviewed feature branches.
- **Short-Lived Feature Branches (`feature/*`):** Created for single, scoped tasks (e.g. `feature/barcode-scanner-ui`). Merged within 48 hours of creation.

### 3.2 Commits (Conventional Commits 1.0)
Commit messages must follow this structure: `<type>(<scope>): <description>`.

- `feat:` Introduces a new feature or endpoint.
- `fix:` Patches a bug or resolves an issue.
- `docs:` Changes to documentation or specifications.
- `style:` Code style modifications (e.g. formatting, semi-colons).
- `refactor:` Code restructurings that do not change external behavior.
- `test:` Adds or modifies unit, integration, or E2E tests.
- `chore:` Changes to build tools, dependencies, or configuration parameters.

Example: `feat(workout): add brzycki 1rm calculations to log form`

---

## 4. CODING PRINCIPLES & GUIDELINES

1. **Keep Comments and Docstrings:** Never delete or overwrite comments or docstrings that are unrelated to your active changes.
2. **End-to-End Type Safety:** Avoid using the `any` escape hatch. Use strict TypeScript definitions and validate all inputs with Zod schemas before database processing.

---
*End of Document: 12_DEVELOPMENT_RULES.md — Proceed to 13_TESTING_GUIDE.md*
