# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 06. WORKSPACE & REPOSITORY DIRECTORY LAYOUT

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document defines the strict workspace organization and file placement conventions for the KavrioLab repository. All developers and AI agents must follow this structure.

---

## 1. COMPREHENSIVE REPOSITORY DIRECTORY TREE

```
kavriolab/
├── .agents/                        # Workspace-scoped AI rules & skills
│   └── AGENTS.md                   # Custom coding instructions
├── docs/                           # Central architectural documentation
│   ├── 00_PROJECT_OVERVIEW.md
│   ├── 01_PRODUCT_REQUIREMENTS.md
│   └── ...
├── prisma/                         # Database ORM configuration
│   ├── schema.prisma               # Main Prisma database schema
│   ├── migrations/                 # SQL migration output files
│   └── seed.ts                     # Database population seeding script
├── public/                         # Public static files
│   ├── assets/                     # Static graphics and icons
│   └── favicon.ico                 # App favicon asset
├── src/                            # Source application logic
│   ├── app/                        # Next.js 15 App Router routes
│   │   ├── (auth)/                 # Route Group: Authentication layout/pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/            # Route Group: Core dashboard navigation pages
│   │   │   ├── dashboard/
│   │   │   ├── workouts/
│   │   │   └── nutrition/
│   │   ├── api/                    # Route Handlers for API endpoints
│   │   │   ├── sync/
│   │   │   └── upload/
│   │   ├── layout.tsx              # Global root layout template
│   │   └── page.tsx                # Public welcome landing route
│   ├── components/                 # Shared UI elements
│   │   ├── ui/                     # shadcn/ui components (radix primitives)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── dialog.tsx
│   │   └── shared/                 # Custom reusable layout components
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   ├── hooks/                      # Global custom React hooks
│   │   ├── use-offline.ts          # Evaluates connection status changes
│   │   └── use-timer.ts            # Active rest stopwatch helper
│   ├── lib/                        # General configuration utilities
│   │   ├── prisma.ts               # Prisma singleton client instance
│   │   ├── utils.ts                # Tailwind CSS merger helpers
│   │   └── zod.ts                  # Shared validation schemas
│   ├── services/                   # Independent Domain Service Layer
│   │   ├── workout.ts              # Set and routine calculation rules
│   │   ├── nutrition.ts            # Macro targets and TDEE algorithm
│   │   └── ai.ts                   # LLM API connections and RAG contexts
│   ├── styles/                     # Structural CSS files
│   │   └── globals.css             # Main Tailwind styling directives
│   └── types/                      # Global TypeScript definitions
│       └── index.ts                # App type abstractions
├── tests/                          # Integration and E2E test suites
│   ├── e2e/                        # Playwright E2E automation tests
│   └── unit/                       # Vitest component logic tests
├── package.json                    # Package dependancies definition
├── tailwind.config.ts              # Tailwind CSS utility configuration
└── tsconfig.json                   # Strict TypeScript compiler options
```

---

## 2. FILE PLACEMENT RULES & DOMAIN BOUNDARIES

To prevent structure drift, follow these directory placement rules:

1. **API Endpoints vs. Server Actions:**
   - Use **Server Actions** (`src/app/actions/`) for user mutations directly triggered by interactive forms.
   - Use **Route Handlers** (`src/app/api/`) only for external integrations (e.g., Stripe Webhooks, Mobile app syncs, and PWA background synchronization).
2. **Domain Service Decoupling:**
   - Component logic must not write directly to Prisma database interfaces.
   - Database mutations must go through the service layer (`src/services/`), ensuring validation and business rules are applied consistently.
3. **UI Component Separation:**
   - Shared structural components (e.g., sidebars, loaders) belong in `src/components/shared/`.
   - Native primitive configurations (e.g., buttons, inputs, dialogs) belong in `src/components/ui/` and should follow shadcn conventions.

---
*End of Document: 06_FOLDER_STRUCTURE.md — Proceed to 07_DATABASE.md*
