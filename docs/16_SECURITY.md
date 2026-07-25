# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 16. SECURITY, COMPLIANCE, & DATA PRIVACY PROTOCOLS

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the security configurations, RBAC permissions, and compliance mechanisms enforced across the KavrioLab network.

---

## 1. COMPLIANCE STANDARDS (GDPR & HIPPA PREPARATION)

While KavrioLab is not a clinical medical record system, it processes personal health information (PHI) and PII, requiring strict alignment with data protection regulations:

- **The Right to Be Forgotten (GDPR Article 17):** Users can trigger complete profile deletions in the settings panel. This runs transactions that purge all database entries and call API deletes for stored progress photos on Vercel Blob.
- **Data Portability (GDPR Article 20):** Users can download all historical records, biometrics, weight trends, and habit completion stats in a standardized JSON payload.
- **Device-Level Privacy:** Strips EXIF location metadata from progress photo uploads before writing to Vercel Blob.

---

## 2. OWASP TOP 10 MITIGATION STRATEGIES

KavrioLab implements mitigations for common web vulnerabilities:

### 2.1 SQL Injection (SQLi)
- All database queries must run through the Prisma ORM Client, which sanitizes parameter queries by default.
- If raw SQL runs are required, inputs must be parameterized using Prisma's `prisma.$queryRaw` tags.

### 2.2 Cross-Site Scripting (XSS)
- React Server and Client Components escape variables rendered inside JSX.
- Rich text inputs must be sanitized using `dompurify` on server ingestion.

### 2.3 Broken Object Level Authorization (BOLA)
- Database repositories must query records using composite user IDs, ensuring users can access only their own data:
  ```typescript
  // Enforces authorization at the database level
  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, userId: activeSessionUserId }
  });
  ```

### 2.4 Row-Level Security (RLS) on PostgreSQL
- If Supabase, Neon, or direct PostgreSQL 16 interfaces are utilized, RLS policies are turned on for all tenant-specific tables (e.g. `UserProfile`, `WorkoutLog`, `DailyNutritionLog`).
- **PostgreSQL DDL enforcement command:**
  ```sql
  ALTER TABLE "WorkoutLog" ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY workout_user_isolation_policy ON "WorkoutLog"
    FOR ALL
    USING ("userId" = current_setting('request.jwt.claim.sub', true)::uuid);
  ```
- This prevents visual leakage even if prisma API queries miss query parameters filters.

---

## 3. JWT SESSION SECURITY & CONTENT HEADERS

### 3.1 Content Security Policy (CSP)
Configure security headers in `next.config.js` to prevent unauthorized resource injection:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.vercel-storage.com; connect-src 'self' https://api.kavriolab.com https://api.openfoodfacts.org;"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

---

## 4. SYSTEM RBAC ROLES PERMISSION MATRIX

Access privileges are evaluated at both the middleware and Server Action entry points:

| Role Name | Access Paths Allowed | Operations Allowed | Re-Auth Required |
| :--- | :--- | :--- | :--- |
| `USER` | `/dashboard`, `/workouts`, `/settings` | Log personal activities, export JSON profile | No |
| `MODERATOR` | `/admin/food-moderation` | Approve, update, or reject food database submissions | Yes (on session start) |
| `ADMIN` | `/admin/*` | Access usage charts, suspend profiles | Yes (every 30 minutes) |
| `SUPER_ADMIN` | `/admin/*` | Modify subscription configurations, direct database operations | Yes (on action check) |

---
*End of Document: 16_SECURITY.md — Proceed to 17_PERFORMANCE.md*
