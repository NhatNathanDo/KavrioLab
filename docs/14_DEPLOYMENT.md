# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 14. DEPLOYMENT & CI/CD OPS RUNBOOK

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document details the configuration requirements, CI/CD pipeline structures, environment parameters, and migration strategies for deploying KavrioLab to Vercel and PostgreSQL platforms.

---

## 1. ENVIRONMENTS CONFIGURATION CHECKLIST

The following environment variables are required across all deployment stages:

```
+---------------------------------------------------------------------------------------------------+
|                                  ENVIRONMENT VARIABLE MATRIX                                      |
+---------------------------------------------------------------------------------------------------+
|  VARIABLE NAME         |  PURPOSE                     |  PROVIDER SOURCE  |  SECURITY LEVEL       |
|  DATABASE_URL          |  Primary PostgreSQL connection |  Supabase / Neon  |  Secret               |
|  NEXTAUTH_SECRET       |  JWT encryption key seed     |  Auth.js Core     |  Secret               |
|  STRIPE_SECRET_KEY     |  Stripe payment keys         |  Stripe Dashboard |  Secret               |
|  BLOB_READ_WRITE_TOKEN |  Media upload authentication |  Vercel Blob API  |  Secret               |
|  GEMINI_API_KEY        |  AI Multimodal vision token  |  Google AI Studio |  Secret               |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. PRODUCTION HOSTING (VERCEL CONFIGURATION)

KavrioLab is optimized for deployment to Vercel, utilising the Edge Network for low-latency delivery.

### 2.1 File: `vercel.json`
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/tdee-recalc",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 3. CI/CD INTEGRATION PIPELINE (GITHUB ACTIONS)

Every commit pushed to `main` must pass verification checks before building for production deployment.

```
+---------------------------------------------------------------------------------------------------+
|                                      CI/CD PIPELINE FLOW                                          |
+---------------------------------------------------------------------------------------------------+
|  [Push Trigger] -> [Linter & TSC Compile Check] -> [Run Vitest Units] -> [Database Migration Run] |
|                                                                                                   |
|  -> [Playwright E2E Verification] -> [Vercel Deployment Upload]                                  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. ZERO-DOWNTIME DATABASE MIGRATION RULES

To prevent downtime or locks on production tables:
1. **Never drop tables directly:** Instead, deprecate tables in code first, run a migration to remove active relations, and finally execute a cleanup step.
2. **Add columns as Nullable:** New database columns must be added as nullable or with a default value. Run a data-populating script if the column is required, then deploy a migration to add `NOT NULL` constraints.
3. **Execute migrations before deployment:** Prisma migrations must be executed against the database before new application server builds run on the edge network.

---

## 5. ZERO-COST FREE-TIER INFRASTRUCTURE GUIDE
To run KavrioLab in production without incurring cloud server expenses, use the following free-tier provider configurations:

| Infrastructure Service | Chosen Provider | Tier Name & Constraints | Cost |
| :--- | :--- | :--- | :--- |
| **Serverless Web Hosting** | Vercel | **Hobby Tier**<br>• Unlimited deployments, 100GB/month bandwidth. | **$0.00** |
| **PostgreSQL Database** | Supabase or Neon | **Free Tier**<br>• Supabase: 500MB database limit.<br>• Neon: 0.5 GiB storage, auto-suspend after 20m inactivity. | **$0.00** |
| **Image & Progress Photo Host** | Vercel Blob | **Hobby Blob Tier**<br>• 250MB storage, 250MB upload/month bandwidth limit. | **$0.00** |
| **High-Speed Caching Layer** | Upstash | **Redis Free Tier**<br>• 10,000 requests/day, single DB instance. | **$0.00** |
| **Multimodal AI Vision & Coach** | Google AI Studio | **Gemini 1.5 API Free Tier**<br>• 15 Requests Per Minute (RPM), 1 million tokens/minute limit. | **$0.00** |
| **Transactional Email (Magic Link)**| Resend | **Free Tier**<br>• 3,000 emails/month, 100 emails/day limit. | **$0.00** |

### 5.1 Optimization Rules for Free-Tier Safety
1. **Database Vacuuming:** Keep the 500MB DB database size clean by regularly archiving or optimizing audit logs.
2. **Blob Upload Compression:** Compress user progress photos to WebP format client-side before sending to Vercel Blob to save storage space.
3. **Upstash Rate Throttling:** Debounce client cache saves to stay within the 10,000 commands/day limits.
4. **Row-Level Security (RLS) is Free:** PostgreSQL RLS is a built-in feature of PostgreSQL and incurs no operational costs.

---
*End of Document: 14_DEPLOYMENT.md — Proceed to 15_ROADMAP.md*
