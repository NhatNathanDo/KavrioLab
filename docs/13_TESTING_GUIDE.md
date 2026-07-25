# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 13. QA SYSTEM & TESTING HANDBOOK

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the testing architecture, mock configurations, integration test parameters, and E2E validation scripts for the KavrioLab platform.

---

## 1. QA TESTING MATRIX

KavrioLab enforces a multi-tier testing strategy. All PRs must maintain code coverage levels above $80\%$.

```
+---------------------------------------------------------------------------------------------------+
|                                      TESTING PIPELINE MATRICES                                    |
+---------------------------------------------------------------------------------------------------+
|  TEST LEVEL      |  TARGET SCOPES             |  TEST RUNNERS       |  REQUIRED COVERAGE  |
|  Unit Tests      |  Service math, validation  |  Vitest             |  > 90%              |
|  Integration     |  DB Mutations, Sync logic  |  Vitest & Testcontainers | > 80%          |
|  E2E Automation  |  Onboarding, Session Logs  |  Playwright         |  Target Critical Flows|
+---------------------------------------------------------------------------------------------------+
```

---

## 2. UNIT TESTING & MOCKING PROTOCOLS

### 2.1 Testing Service Calculations
Pure functions—such as Mifflin-St Jeor TDEE calculations, 1RM Brzycki estimation formulas, and EMA weight trend updates—must be unit-tested without database mocks.

### 2.2 Prisma Database Mocking Configuration
```typescript
import { vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-jest';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';

vi.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
```

---

## 3. INTEGRATION TESTING PROTOCOLS

Integration tests verify database triggers and session reconciliation mechanisms under network stress.
- **Database Isolation:** Use isolated PostgreSQL test instances inside Docker containers (`Testcontainers`) to isolate and execute integration tests.
- **Offline Sync Validation:** Integration suites must mock service worker connections, ensuring the synchronization handler matches offline mutations and writes to PostgreSQL correctly without schema corruption.

---

## 4. END-TO-END AUTOMATION FLOWS (PLAYWRIGHT)

End-to-end automation scripts target critical user journeys. These tests run in chromium, webkit, and firefox viewports.

### 4.1 Critical Flow: Workout Logging Test Script
```typescript
import { test, expect } from '@playwright/test';

test.describe('Active Workout Log Journey', () => {
  test('User can start, log sets, and save a workout', async ({ page }) => {
    // 1. Authenticate and navigate to dashboard
    await page.goto('/login');
    await page.fill('input[type="email"]', 'testathlete@kavriolab.com');
    await page.fill('input[type="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Start workout session
    await page.click('[data-testid="start-workout-btn"]');
    await expect(page.locator('[data-testid="active-timer"]')).toBeVisible();

    // 3. Log values and complete set
    await page.fill('[data-testid="set-weight-input-0"]', '100');
    await page.fill('[data-testid="set-reps-input-0"]', '5');
    await page.click('[data-testid="complete-set-checkbox-0"]');

    // 4. Verify rest timer triggers
    await expect(page.locator('[data-testid="rest-timer-overlay"]')).toBeVisible();

    // 5. Complete workout session
    await page.click('[data-testid="finish-workout-btn"]');
    await expect(page).toHaveURL('/workouts/history');
  });
});
```

---
*End of Document: 13_TESTING_GUIDE.md — Proceed to 14_DEPLOYMENT.md*
