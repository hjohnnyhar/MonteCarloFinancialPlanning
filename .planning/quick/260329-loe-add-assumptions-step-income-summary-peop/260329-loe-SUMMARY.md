---
phase: quick
plan: 260329-loe
subsystem: interview-wizard, simulation-engine, results-page
tags: [wizard-step, assumptions, inflation, simulation, results-display]
dependency_graph:
  requires: [260329-kyl]
  provides: [plan-assumptions-step, plan-level-inflation, survivor-income-model, household-income-card]
  affects: [interview-wizard, simulation-engine, results-page]
tech_stack:
  added: []
  patterns: [percentAsDecimal-zod-transform, getInflationRate-plan-aware, survivor-income-model]
key_files:
  created:
    - src/components/interview/steps/AssumptionsStep.tsx
  modified:
    - src/lib/types.ts
    - src/lib/planDefaults.ts
    - src/lib/wizardSteps.ts
    - src/lib/wizardSchemas.ts
    - src/app/interview/page.tsx
    - src/components/interview/goals/RetirementGoalForm.tsx
    - src/components/interview/steps/GoalsStep.tsx
    - src/lib/simulation.ts
    - src/app/simulation/page.tsx
    - src/lib/__tests__/simulation.test.ts
decisions:
  - "percentAsDecimal zod transform: user enters 2.5 (%), stored as 0.025 decimal — display multiply by 100 on reset"
  - "getInflationRate helper reads plan.planAssumptions.goodsInflation with 0.025 fallback — removes hardcoded INFLATION_RATE dependency internally"
  - "simulateOnePath and computeInflatedTarget accept inflationRate as parameter — enables per-plan inflation without global state"
  - "computeHouseholdIncome uses min(retirementAge, deathAge) as incomeEndAge — survivor model stops income at death not just retirement"
  - "Household Income card uses IIFE pattern in JSX to compute and conditionally render without extracting to separate component"
metrics:
  duration: 398s
  completed: 2026-03-29
  tasks: 3
  files: 10
---

# Phase quick Plan 260329-loe: Assumptions Step, Income Summary, and People-aware Goal Pre-fill Summary

**One-liner:** User-configurable inflation rates via new Plan Assumptions wizard step (7 steps total), survivor income model in simulation, and Household Income card on results page.

## What Was Built

### Task 1: PlanAssumptions type, schema, AssumptionsStep, and 7-step wizard
- Added `PlanAssumptions` interface to `types.ts` with 4 inflation rate fields (decimal) and `includeSocialSecurity` boolean
- Added `planAssumptions` field to `FinancialPlan` interface (after `people`)
- Added `planAssumptions` defaults to `createEmptyPlan()` (all 0.025, SS off)
- Added `assumptionsSchema` to `wizardSchemas.ts` using `percentAsDecimal` transform (0-100 in, 0-1 out)
- Inserted "Plan Assumptions" at index 1 in `WIZARD_STEPS` — wizard now has 7 steps
- Created `AssumptionsStep.tsx` with 4 inflation inputs + Social Security checkbox, following IncomeExpensesStep pattern
- Updated `interview/page.tsx` to route case 1 to AssumptionsStep, shift all other cases +1, and save `wizardStep: 6` on finish

### Task 2: Survivor income model, plan-level inflation, retirement age pre-fill
- Added `getInflationRate(plan)` helper reading `plan.planAssumptions.goodsInflation ?? 0.025`
- Threaded `inflationRate` parameter through `simulateOnePath` and `computeInflatedTarget` — no more `INFLATION_RATE` references internally
- Updated `runSimulation`, `runLightweightSim`, and `extractMedianPath` to call `getInflationRate(plan)` and pass through
- `computeHouseholdIncome` now uses `Math.min(retirementAge, deathAge)` as `incomeEndAge` — income stops at death, not just retirement
- Added `plan?: FinancialPlan` prop to `RetirementGoalForm` for `targetRetirementAge` pre-fill from `plan.people[0].retirementAge ?? 65`
- `GoalsStep` passes `plan={plan}` to `RetirementGoalForm` in `renderGoalForm`
- Updated simulation test: Test 6 now asserts `inflationRate === 0.025` (plan default) not hardcoded 0.03

### Task 3: Household Income card on simulation results page
- Added inline computation `householdIncome = plan.people.reduce(...)` with `hasIncome` guard
- Inserted card between probability score and goal breakdown — only renders when `hasIncome` is true
- 2-person plans: per-person lines showing name and income contribution, plus total
- 1-person plans: single total line
- Uses `formatCurrency` from `formatters.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale test asserting hardcoded inflation rate**
- **Found during:** Task 2 verification
- **Issue:** `simulation.test.ts` Test 6 asserted `assumptions.inflationRate === 0.03` (the old hardcoded `INFLATION_RATE` constant). After the change to read from `plan.planAssumptions.goodsInflation` (default 0.025), this test became stale.
- **Fix:** Updated test description and assertion to check `0.025` (plan default). Kept `expect(INFLATION_RATE).toBe(0.03)` to verify backwards-compat export is unchanged.
- **Files modified:** `src/lib/__tests__/simulation.test.ts`
- **Commit:** e1f3b03

## Known Stubs

None. All features are fully wired to live plan data.

## Self-Check: PASSED

- FOUND: src/components/interview/steps/AssumptionsStep.tsx
- FOUND: PlanAssumptions interface in src/lib/types.ts
- FOUND: commit c9c6d45 (Task 1)
- FOUND: commit e1f3b03 (Task 2)
- FOUND: commit 782386c (Task 3)
- All 52 tests pass
