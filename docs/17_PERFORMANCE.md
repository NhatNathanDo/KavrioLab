# KAVRIOLAB: MODERN FITNESS OPERATING SYSTEM
## 17. PERFORMANCE METRICS & CLIENT SPEED RULES

**Document Version:** 1.0.0-PROD  
**Status:** APPROVED  

This document outlines the performance benchmarks, bundle size limitations, query optimization strategies, and loading targets for KavrioLab.

---

## 1. PERFORMANCE BUDGET & CORE WEB VITALS

Every build deployed to production must maintain performance metrics within the following target ranges:

```
+---------------------------------------------------------------------------------------------------+
|                                      WEB VITALS METRICS TARGETS                                   |
+---------------------------------------------------------------------------------------------------+
|  METRIC NAME                 |  FULL TITLE                  |  DESIRED THRESHOLD  |  MEASURE TOOL  |
|  LCP                         |  Largest Contentful Paint     |  < 1.8 seconds      |  Lighthouse    |
|  INP                         |  Interaction to Next Paint   |  < 100 ms           |  Web-Vitals JS |
|  CLS                         |  Cumulative Layout Shift     |  < 0.05             |  Lighthouse    |
|  TTFB                        |  Time to First Byte          |  < 200 ms           |  Edge Latency  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. CLIENT BUNDLE CODE-SPLITTING RULES

To keep the initial load fast on mobile devices, heavy modules must be loaded lazily:

- **Barcode Scanners:** The `@zxing/library` scanner camera engine must be loaded only when the user opens the scanner dialog.
- **Analytics Charts:** Recharts components are split into client chunks, loading only when the `/analytics` page is viewed.
- **Motion Libraries:** Framer motion presets load using `m` components instead of full default imports, reducing library footprint sizes.

```typescript
import dynamic from 'next/dynamic';

// Lazily load heavy modules to reduce initial client bundle size
const BarcodeScannerCanvas = dynamic(
  () => import('@/components/nutrition/BarcodeScannerCanvas'),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
```

---

## 3. PRISMA DATABASE QUERY OPTIMIZATIONS

- **Restrict Select Fields:** Never use default queries that return all table columns. Restrict fields to return only necessary parameters.
  ```typescript
  // Avoids fetching large notes and instructional strings
  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
      category: true
    }
  });
  ```
- **Prevent N+1 Queries:** Use joins or structured subqueries via Prisma relations instead of mapping over query lists to execute additional lookups.
- **Index Enforcement:** Queries on the set database must run using composite indexes (`(workoutLogExerciseId, completed)`).

---

## 4. TANSTACK QUERY OPTIMISTIC UI CONFIGURATIONS

Mutations must use optimistic UI updates to provide immediate feedback on touch controls:

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: completeWorkoutSet,
  onMutate: async (newSet) => {
    await queryClient.cancelQueries({ queryKey: ['workout', newSet.logId] });
    const previousWorkoutState = queryClient.getQueryData(['workout', newSet.logId]);
    
    // Optimistically update target set immediately
    queryClient.setQueryData(['workout', newSet.logId], (old) => 
      updateWorkoutSetInList(old, newSet)
    );
    
    return { previousWorkoutState };
  },
  onError: (err, newSet, context) => {
    // Rollback to previous state on validation failures
    queryClient.setQueryData(['workout', newSet.logId], context.previousWorkoutState);
  },
  onSettled: (newSet) => {
    queryClient.invalidateQueries({ queryKey: ['workout', newSet.logId] });
  }
});
```

---
*End of Document: 17_PERFORMANCE.md — Proceed to 18_ADMIN_SYSTEM.md*
