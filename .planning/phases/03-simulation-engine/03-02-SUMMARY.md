---
phase: 03-simulation-engine
plan: 02
subsystem: simulation-api-ui
tags: [simulation, api, what-if, skeleton, navigation]
dependency_graph:
  requires: [03-01]
  provides: [POST /api/simulate, /simulation page, WhatIfPanel, SimulationSkeleton, wizard-to-simulation nav]
  affects: [src/app/interview/page.tsx, src/app/simulation/page.tsx, src/app/api/simulate/route.ts]
tech_stack:
  added: []
  patterns:
    - POST API route with isWhatIf flag for conditional persistence
    - Client-side useEffect auto-run on mount with loading skeleton
    - What-if panel with three levers (savings rate, retirement age, risk level) via RETURN_ASSUMPTIONS
    - Cleanup pattern (cancelled flag) in useEffect to prevent state updates after unmount
key_files:
  created:
    - src/app/api/simulate/route.ts
    - src/app/simulation/page.tsx
    - src/components/simulation/SimulationSkeleton.tsx
    - src/components/simulation/WhatIfPanel.tsx
  modified:
    - src/app/interview/page.tsx
    - src/components/simulation/WhatIfPanel.tsx (post-checkpoint fix)
    - src/lib/persistence.ts (post-checkpoint fix)
    - src/lib/simulation.ts (post-checkpoint fix)
decisions:
  - isWhatIf flag controls persistence — what-if re-runs return results but never call writePlan
  - /simulation page fetches plan via GET /api/plan then fires POST /api/simulate on mount
  - WhatIfPanel hides retirement age lever when plan has no retirement goals
  - Risk level select maps directly to RETURN_ASSUMPTIONS to produce returnMean and returnStdDev overrides
  - WhatIfPanel uses string state for number inputs to prevent "0 stuck" bug on controlled inputs
  - persistence.ts back-fills defaults on read so old plans without currentAge do not crash
  - handleFinish saves wizardStep 4 (not 5) to prevent "step 6 of 5" on resume
metrics:
  duration_minutes: 5
  completed_date: "2026-03-29"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 03 Plan 02: Simulation API and UI Summary

**One-liner:** POST /api/simulate with isWhatIf flag wired to runSimulation, /simulation page with auto-run skeleton loading and three-lever what-if panel, wizard navigates to /simulation on finish — full end-to-end flow verified by human.

## Tasks Completed

### Task 1: Create POST /api/simulate route, /simulation page, skeleton, and what-if panel
**Commit:** c802ff4

Created all four files in one pass:
- `src/app/api/simulate/route.ts` — POST endpoint that calls `runSimulation(plan, overrides)`, persists results via `writePlan` only when `isWhatIf` is false
- `src/components/simulation/SimulationSkeleton.tsx` — animate-pulse skeleton with headline and three goal-row placeholders
- `src/components/simulation/WhatIfPanel.tsx` — savings rate (%), retirement age (hidden when no retirement goal), and risk level select that maps to RETURN_ASSUMPTIONS values; "Run What-If" button disabled during loading
- `src/app/simulation/page.tsx` — 'use client' page with useEffect auto-run on mount (isWhatIf: false), handleWhatIf callback (isWhatIf: true), displays overall probability as large percentage plus per-goal breakdown with color-coded probability scores and funding gaps

### Task 2: Wire wizard completion to /simulation navigation
**Commit:** 8fbe463

One-line change in `src/app/interview/page.tsx`: `handleFinish` now calls `router.push('/simulation')` instead of `router.push('/')`. The /simulation page auto-fires the simulation on mount, completing the interview-to-results flow.

### Task 3: Verify full simulation flow end-to-end
**Status:** COMPLETE — human verified and approved

Full end-to-end flow confirmed:
- Wizard completion navigates to /simulation
- Loading skeleton appears during simulation run
- Overall probability score and per-goal results display correctly
- What-if panel shows savings rate, retirement age, and risk level controls
- Changing savings rate and re-running updates results
- What-if changes do not persist to plan.json

Automated checks passed:
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 31/31 tests passed

## Deviations from Plan

### Post-Checkpoint Fixes (applied by orchestrator after Task 2 commit, before human verification)

These fixes resolved issues discovered during end-to-end testing. They are already committed and are documented here for traceability.

**1. [Rule 1 - Bug] WhatIfPanel string state for number inputs**
- **Found during:** Manual verification (Task 3)
- **Issue:** Controlled number inputs would get stuck at "0" — clearing the field and typing a new value was broken because React controlled inputs with `type="number"` and numeric state treat empty string as 0
- **Fix:** Changed WhatIfPanel state for savings rate and retirement age from `number` to `string`; parse to number only on submit
- **Files modified:** `src/components/simulation/WhatIfPanel.tsx`

**2. [Rule 1 - Bug] persistence.ts back-fills defaults on read**
- **Found during:** Manual verification (Task 3)
- **Issue:** Plans saved before `currentAge` was added to the schema crashed the simulation engine with undefined values
- **Fix:** `readPlan` in `persistence.ts` back-fills `currentAge` and other new fields with sensible defaults when loading old plan files
- **Files modified:** `src/lib/persistence.ts`

**3. [Rule 1 - Bug] ITERATION_COUNT restored to 10,000**
- **Found during:** Manual verification (Task 3)
- **Issue:** `ITERATION_COUNT` had been reduced during development (likely for faster test cycles) and was not restored before shipping
- **Fix:** Restored `ITERATION_COUNT` to 10,000 in `src/lib/simulation.ts`
- **Files modified:** `src/lib/simulation.ts`

**4. [Rule 1 - Bug] handleFinish saves wizardStep 4 not 5**
- **Found during:** Manual verification (Task 3)
- **Issue:** `handleFinish` was saving `wizardStep: 5` but the wizard only has steps 0-4 (5 total), causing "step 6 of 5" on resume
- **Fix:** Changed `handleFinish` to save `wizardStep: 4` (the last valid step index); also corrected `data/plan.json` wizardStep value
- **Files modified:** `src/app/interview/page.tsx`, `data/plan.json`

## Known Stubs

None. The /simulation page displays real simulation results from the Monte Carlo engine (Plan 01). The display is intentionally minimal (Phase 4 will build full results UI per plan spec), but all data is wired and non-stub.

## Self-Check: PASSED

Files exist:
- src/app/api/simulate/route.ts — FOUND
- src/app/simulation/page.tsx — FOUND
- src/components/simulation/SimulationSkeleton.tsx — FOUND
- src/components/simulation/WhatIfPanel.tsx — FOUND

Commits exist:
- c802ff4 — FOUND
- 8fbe463 — FOUND
