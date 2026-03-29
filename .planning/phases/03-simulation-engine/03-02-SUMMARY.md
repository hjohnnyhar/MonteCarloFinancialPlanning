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
decisions:
  - isWhatIf flag controls persistence — what-if re-runs return results but never call writePlan
  - /simulation page fetches plan via GET /api/plan then fires POST /api/simulate on mount
  - WhatIfPanel hides retirement age lever when plan has no retirement goals
  - Risk level select maps directly to RETURN_ASSUMPTIONS to produce returnMean and returnStdDev overrides
metrics:
  duration_minutes: 2
  completed_date: "2026-03-29"
  tasks_completed: 2
  tasks_total: 3
  files_created: 4
  files_modified: 1
---

# Phase 03 Plan 02: Simulation API and UI Summary

**One-liner:** POST /api/simulate with isWhatIf flag wired to runSimulation, /simulation page with auto-run skeleton loading and three-lever what-if panel, wizard navigates to /simulation on finish.

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
**Status:** AWAITING HUMAN VERIFICATION (checkpoint:human-verify)

Automated checks passed before checkpoint:
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 31/31 tests passed

## Deviations from Plan

None — plan executed exactly as written.

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
