---
phase: quick
plan: 260330-pit
subsystem: database
tags: [supabase, persistence, planId, multi-plan, url-search-params, next-js]

# Dependency graph
requires:
  - phase: 04-results-reporting
    provides: Simulation results, PDF report, full plan interview flow
provides:
  - Supabase-backed plan persistence (replaces filesystem JSON)
  - planId-based multi-plan support via URL search params
  - Preparer entry screen for creating/loading plans
  - /api/plan/create endpoint for plan initialization
affects: [future-phases, any code that calls readPlan/writePlan]

# Tech tracking
tech-stack:
  added: [@supabase/supabase-js]
  patterns:
    - Supabase upsert pattern for plan persistence keyed by planId
    - planId propagated via URL search params (?planId=) across all pages
    - useSearchParams() in hooks/components to read planId from URL
    - Suspense boundary wrapping useSearchParams consumers in page components

key-files:
  created:
    - src/lib/supabase.ts
    - src/lib/generatePlanId.ts
    - src/app/api/plan/create/route.ts
  modified:
    - src/lib/types.ts
    - src/lib/planDefaults.ts
    - src/lib/persistence.ts
    - src/lib/__tests__/persistence.test.ts
    - src/app/api/plan/route.ts
    - src/app/api/simulate/route.ts
    - src/hooks/usePlan.ts
    - src/app/page.tsx
    - src/app/interview/page.tsx
    - src/app/simulation/page.tsx
    - src/components/Sidebar.tsx

key-decisions:
  - "Supabase upsert keyed on plans.id = metadata.planId; data column stores full FinancialPlan JSON"
  - "generatePlanId produces name+mmddyyyy format (e.g., JohnSmith03302026)"
  - "readPlan(planId='') returns createEmptyPlan() without querying Supabase — empty planId is valid sentinel"
  - "usePlan exports planId in return value so interview/simulation pages can thread it through without re-reading URL"
  - "SimulationPage wraps content in Suspense boundary to satisfy Next.js useSearchParams() requirement"

patterns-established:
  - "planId threading: all page-level components read planId from useSearchParams, pass through fetch calls"
  - "Sidebar appends ?planId= to non-home nav items when planId is known"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-30
---

# Quick Task 260330-pit: Supabase Migration Summary

**Supabase-backed multi-plan persistence with planId URL threading, preparer entry screen, and /api/plan/create endpoint replacing single-file JSON storage**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-30
- **Tasks:** 3
- **Files modified:** 11 modified, 3 created

## Accomplishments

- Replaced filesystem JSON persistence with Supabase (plans table, id + data + updated_at columns)
- Added planId and preparerName to PlanMetadata; all pages thread planId via URL search params
- Built preparer entry screen replacing the old dashboard (Start Plan + Continue Existing Plan)
- Created POST /api/plan/create endpoint that generates a planId and persists initial empty plan
- Rewrote persistence tests using vi.mock Supabase chain mocks (6 tests passing)
- All 50 existing tests still pass after migration

## Task Commits

1. **Task 1: Install Supabase, update types/defaults, rewrite persistence layer** - `4a79be0` (feat)
2. **Task 2: Update API routes and create /api/plan/create endpoint** - `5a375d4` (feat)
3. **Task 3: Preparer entry screen, planId threading through pages and sidebar** - `f2d6bad` (feat)

## Files Created/Modified

- `src/lib/supabase.ts` - Supabase client singleton using env vars
- `src/lib/generatePlanId.ts` - planId generator: name+mmddyyyy format
- `src/lib/types.ts` - Added planId and preparerName to PlanMetadata
- `src/lib/planDefaults.ts` - Added planId: '' and preparerName: '' defaults
- `src/lib/persistence.ts` - Replaced fs-based read/write with Supabase queries
- `src/lib/__tests__/persistence.test.ts` - New Supabase-mocked tests (6 passing)
- `src/app/api/plan/route.ts` - GET accepts ?planId=, uses NextRequest
- `src/app/api/plan/create/route.ts` - NEW: POST creates plan, returns { planId }
- `src/app/api/simulate/route.ts` - Reads planId from request body
- `src/hooks/usePlan.ts` - Reads planId from useSearchParams, exports planId
- `src/app/page.tsx` - Replaced dashboard with preparer entry screen
- `src/app/interview/page.tsx` - Redirects to / if no planId; passes planId on finish
- `src/app/simulation/page.tsx` - Reads planId from URL, includes in all API calls; Suspense wrapper
- `src/components/Sidebar.tsx` - Appends ?planId= to Interview/Simulation nav links

## Decisions Made

- Supabase upsert keyed on `plans.id = metadata.planId`; `data` column stores the full FinancialPlan JSON blob
- `generatePlanId` uses name+mmddyyyy (e.g., JohnSmith03302026) — simple, human-readable, collision-resistant for a single-user prototype
- `readPlan('')` returns `createEmptyPlan()` without querying Supabase; empty planId is a valid sentinel for "no plan loaded"
- `usePlan` exports `planId` so consumers don't need to re-read `useSearchParams` themselves
- `SimulationPage` wrapped `SimulationContent` in a `Suspense` boundary — required by Next.js App Router for components using `useSearchParams()`

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added Suspense boundary to SimulationPage**
- **Found during:** Task 3 (simulation page update)
- **Issue:** Next.js App Router requires `useSearchParams()` to be wrapped in a `Suspense` boundary in page components; without it, the build would fail at deployment
- **Fix:** Extracted page body to `SimulationContent` component, wrapped it in `<Suspense fallback={<SimulationSkeleton />}>` in the default export
- **Files modified:** `src/app/simulation/page.tsx`
- **Committed in:** `f2d6bad` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for Next.js correctness; no scope creep.

## Issues Encountered

None beyond the Suspense deviation above.

## User Setup Required

**Supabase requires manual configuration before the app can persist plans.**

1. Create a Supabase project at https://supabase.com
2. Create the `plans` table in the Supabase SQL editor:
   ```sql
   create table plans (
     id text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );
   ```
3. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Next Phase Readiness

- Multi-plan Supabase persistence is in place; any future phase can rely on planId-based storage
- The preparer entry screen is the new landing page; interview and simulation pages require a planId in the URL
- Known gap: no error handling if Supabase project is not yet configured (app will show blank/error states until env vars are set)

---
*Phase: quick*
*Completed: 2026-03-30*

## Self-Check: PASSED

- FOUND: src/lib/supabase.ts
- FOUND: src/lib/generatePlanId.ts
- FOUND: src/app/api/plan/create/route.ts
- FOUND: .planning/quick/260330-pit-SUMMARY.md
- FOUND: commit 4a79be0 (Task 1)
- FOUND: commit 5a375d4 (Task 2)
- FOUND: commit f2d6bad (Task 3)
