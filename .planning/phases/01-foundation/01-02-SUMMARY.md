---
phase: 01-foundation
plan: 02
subsystem: api
tags: [next.js, typescript, json, persistence, react-hooks, vitest]

# Dependency graph
requires:
  - phase: 01-01
    provides: FinancialPlan TypeScript types, createEmptyPlan factory, Next.js app scaffold
provides:
  - readPlan() reads data/plan.json, returns empty plan if missing, throws on corrupt JSON
  - writePlan() writes to data/plan.json, increments version, updates updatedAt
  - GET /api/plan returns FinancialPlan JSON (or empty plan if no file)
  - PUT /api/plan saves plan to disk and returns updated plan with incremented version
  - usePlan React hook with auto-save on every updatePlan call
  - Dashboard page wired to real plan data from API
affects:
  - 02-interview
  - 03-simulation
  - 04-results

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js App Router route handlers for server-side I/O
    - Auto-save via optimistic update in usePlan hook (PUT on every mutation, no save button)
    - Dynamic process.cwd() in persistence functions for testability with vi.spyOn

key-files:
  created:
    - src/lib/persistence.ts
    - src/lib/__tests__/persistence.test.ts
    - src/app/api/plan/route.ts
    - src/hooks/usePlan.ts
    - data/.gitkeep
    - data/.gitignore
  modified:
    - src/app/page.tsx
    - .gitignore

key-decisions:
  - "process.cwd() wrapped in arrow functions (not module-level const) so tests can override via vi.spyOn(process, 'cwd')"
  - "writePlan() returns the updated plan with incremented metadata so callers get server-confirmed version"
  - "Optimistic update in usePlan: state updates immediately, then server response replaces with confirmed version"
  - "data/.gitignore added as extra safety net to prevent plan.json leaking even if top-level .gitignore is modified"

patterns-established:
  - "Route handlers: thin — delegate to lib functions, catch all errors, return 500 with message on failure"
  - "File path derivation: always path.join(process.cwd(), ...) — never hardcoded strings"
  - "Auto-save pattern: usePlan hook fires PUT on every updatePlan call, no explicit save trigger"

requirements-completed: [DATA-01, DATA-02, DATA-03]

# Metrics
duration: 15min
completed: 2026-03-28
---

# Phase 01 Plan 02: JSON Persistence and Auto-Save Summary

**JSON persistence layer with readPlan/writePlan functions, GET/PUT Next.js API route handlers, and auto-saving usePlan React hook wired to the dashboard**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28T19:10:48Z
- **Completed:** 2026-03-28T19:14:30Z
- **Tasks:** 2 (Task 1 TDD: 3 commits; Task 2: 1 commit)
- **Files modified:** 8

## Accomplishments
- Persistence layer (`readPlan`/`writePlan`) with ENOENT handling, corrupt-JSON error, directory creation, version/timestamp mutation — fully TDD-tested (8 tests)
- GET/PUT Next.js route handlers with comprehensive error handling (500 on any failure)
- `usePlan` React hook with optimistic update and auto-save on every `updatePlan` call
- Dashboard page wired to real plan data — shows version, last updated, goals count, simulation status

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing persistence tests** - `838c812` (test)
2. **Task 1 GREEN: Implement persistence.ts** - `3e3b5ab` (feat)
3. **Task 2: API routes, usePlan hook, dashboard, data/.gitkeep** - `dc471e7` (feat)

## Files Created/Modified
- `src/lib/persistence.ts` - readPlan() and writePlan() with fs/promises and process.cwd()-based paths
- `src/lib/__tests__/persistence.test.ts` - 8 vitest tests covering all behavior cases
- `src/app/api/plan/route.ts` - GET and PUT Next.js App Router route handlers
- `src/hooks/usePlan.ts` - React hook returning { plan, isLoading, error, updatePlan } with auto-save
- `src/app/page.tsx` - Dashboard updated to use usePlan hook and display real plan metadata
- `data/.gitkeep` - Tracks data/ directory in git without committing plan.json
- `data/.gitignore` - Extra safety net: excludes plan.json within data/ directory
- `.gitignore` - Changed `data/` to `data/plan.json` to allow tracking .gitkeep

## Decisions Made
- **Dynamic process.cwd()**: Used arrow functions `() => path.join(process.cwd(), ...)` instead of module-level constants, so `vi.spyOn(process, 'cwd')` can override the path in tests without module re-loading complexity.
- **writePlan returns updated plan**: The function returns the mutated plan object (with incremented version/updatedAt) so the caller (route handler and usePlan hook) can use the server-confirmed version.
- **Optimistic update in usePlan**: State is updated immediately before the PUT resolves, then replaced with server-confirmed data on success. This avoids flickering while ensuring metadata.version stays in sync.

## Deviations from Plan

None - plan executed exactly as written.

One minor pragmatic difference: the plan showed `PLAN_FILE` and `DATA_DIR` as module-level constants. Changed to arrow functions to enable `vi.spyOn(process, 'cwd')` in tests (Rule 1/2: required for tests to work). This matches the plan's stated intent of testability and doesn't change the production behavior.

## Issues Encountered
- Worktree had no `node_modules` — ran `npm install` before tests could execute. Not a blocker, resolved immediately.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DATA-01, DATA-02, DATA-03 all satisfied
- `usePlan` hook is the single integration point for all future phases — call `updatePlan(patch)` from interview/simulation/results and data reaches disk automatically
- GET /api/plan and PUT /api/plan are the only API endpoints needed until Phase 3 (simulation may add its own)
- No blockers for Phase 2 (interview UI)

---
*Phase: 01-foundation*
*Completed: 2026-03-28*

## Self-Check: PASSED

All files and commits verified:
- src/lib/persistence.ts: FOUND
- src/lib/__tests__/persistence.test.ts: FOUND
- src/app/api/plan/route.ts: FOUND
- src/hooks/usePlan.ts: FOUND
- data/.gitkeep: FOUND
- data/.gitignore: FOUND
- .planning/phases/01-foundation/01-02-SUMMARY.md: FOUND
- 838c812 (test RED): FOUND
- 3e3b5ab (feat GREEN): FOUND
- dc471e7 (feat Task 2): FOUND
