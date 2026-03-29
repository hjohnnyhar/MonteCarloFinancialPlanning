---
phase: quick
plan: 260329-kyl
subsystem: interview-wizard, simulation-engine
tags: [people, multi-person, wizard-step, simulation, longevity]
dependency_graph:
  requires: []
  provides: [people-step, people-based-simulation, per-person-income-phasing]
  affects: [interview-wizard, simulation-engine, pdf-report]
tech_stack:
  added: []
  patterns: [react-hook-form useFieldArray, actuarial longevity constants, per-year income phasing]
key_files:
  created:
    - src/components/interview/steps/PeopleStep.tsx
  modified:
    - src/lib/types.ts
    - src/lib/planDefaults.ts
    - src/lib/wizardSchemas.ts
    - src/lib/wizardSteps.ts
    - src/lib/simulation.ts
    - src/components/interview/steps/IncomeExpensesStep.tsx
    - src/components/interview/goals/RetirementGoalForm.tsx
    - src/components/interview/steps/GoalsStep.tsx
    - src/components/interview/steps/ReviewStep.tsx
    - src/app/interview/page.tsx
    - src/app/simulation/page.tsx
    - src/components/pdf/FinancialPlanReport.tsx
    - src/lib/__tests__/simulation.test.ts
    - src/lib/__tests__/recommendations.test.ts
    - src/lib/__tests__/yearly-projection.test.ts
    - src/lib/__tests__/planDefaults.test.ts
decisions:
  - "Person interface uses birthdate (string) rather than currentAge so simulation always has current age at run time"
  - "Actuarial longevity: male=87, female=92, other=90 — plan horizon = max death age across all people"
  - "Per-person income phasing: each person's income stops when personCurrentAge + yearIndex >= person.retirementAge"
  - "yearsInRetirement derived as simulationEndAge - resolvedRetirementAge (no longer a user-input field)"
  - "computeInflatedTarget() receives derivedYearsInRetirement as parameter instead of reading from goal"
  - "People step is index 0, total wizard steps = 6; handleFinish saves wizardStep=5"
  - "Retirement age field in PeopleStep shown conditionally (only if person has salary or other income > 0)"
  - "ReviewStep goToStep indices updated to reflect new 6-step layout"
  - "Existing plans without people field load without crashing due to back-fill in readPlan()"
metrics:
  duration: "8 minutes"
  completed_date: "2026-03-29"
  tasks_completed: 3
  files_changed: 16
---

# Quick Task 260329-kyl: Add People Step to Interview Wizard

**One-liner:** Multi-person (1-2 people) wizard step with birthdate-based age derivation, per-person income phasing, and sex-based actuarial longevity replacing manual currentAge/yearsInRetirement inputs.

## What Was Built

Added a new "People" step as the first step in the interview wizard. The step collects 1 or 2 people with name, sex, birthdate, annual salary, other income, and retirement age per person. The simulation engine was updated to derive all age-related calculations from people data rather than manually entered values.

## Tasks Completed

### Task 1: Types, schemas, defaults, wizard steps (commit: 80859b1)

- Added `Person` interface to `types.ts`
- Added `people: Person[]` to `FinancialPlan`, removed `currentAge`
- Removed `salary` and `otherAnnualIncome` from `Income` interface (kept `annualSavingsRate`)
- Removed `yearsInRetirement` from `RetirementGoal`
- Added `peopleSchema` and `PeopleFormData` to `wizardSchemas.ts`
- Updated `incomeExpensesSchema` and `retirementGoalSchema` to remove removed fields
- Added People step as index 0 in `WIZARD_STEPS` (6 total steps)
- Updated `planDefaults.ts` to `people: []` and stripped income defaults

### Task 2: PeopleStep and UI updates (commit: 369a225)

- Created `PeopleStep.tsx` with 1/2 person selector (selectable card buttons), person forms using `useFieldArray`, conditional retirement age field (shown only when person has income)
- Updated `IncomeExpensesStep.tsx`: removed age/salary/other income, kept savings rate + expenses only
- Updated `RetirementGoalForm.tsx`: removed `yearsInRetirement` field (now derived from longevity)
- Updated `GoalsStep.tsx`: `getGoalDetails` shows "Retire at age X" instead of "X years in retirement"
- Updated `interview/page.tsx`: 6-case switch (0=People, 1=Income, 2=Assets, 3=Goals, 4=Risk, 5=Review), handleFinish saves wizardStep=5
- Updated `ReviewStep.tsx`: removed salary/other income display, updated all goToStep indices
- Fixed `simulation/page.tsx`: derive currentAge from `plan.people[0].birthdate`
- Fixed `FinancialPlanReport.tsx` (PDF): replaced currentAge/salary display with people-based income total

### Task 3: Simulation engine and tests (commit: 33e2429)

- Added `EXPECTED_DEATH_AGE` constants (male=87, female=92, other=90)
- Added `deriveCurrentAge(birthdate)` helper
- Added `deriveSimulationEndAge(people)` — max death age across all people
- Added `computeHouseholdIncome(people, currentAge, yearIndex)` — income phasing per person per year
- Replaced all `plan.currentAge` references with `deriveCurrentAge(plan.people[0].birthdate)`
- Replaced fixed `annualSavings` with year-aware `computeHouseholdIncome()` in `simulateOnePath` and `extractMedianPath`
- Derived `planHorizon` from `simulationEndAge - currentAge` instead of `yearsToRetirement + yearsInRetirement`
- `computeInflatedTarget()` now receives `derivedYearsInRetirement` as parameter
- Updated all three test files: replaced `currentAge`/`salary`/`yearsInRetirement` with `people[]` and birthdates

## Verification

- `npx tsc --noEmit`: zero errors
- `npx vitest run`: 52/52 tests pass (5 test files)

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Updated ReviewStep goToStep indices**
- **Found during:** Task 2
- **Issue:** ReviewStep had hardcoded goToStep(0), (1), (2), (3) targeting old 5-step layout. With the new 6-step layout these would navigate to wrong steps.
- **Fix:** Updated to goToStep(1), (2), (3), (4) matching new step indices
- **Files modified:** `src/components/interview/steps/ReviewStep.tsx`
- **Commit:** 369a225

**2. [Rule 2 - Missing critical functionality] Fixed PDF report and simulation page for removed fields**
- **Found during:** Task 2 — TypeScript errors revealed these files also used removed fields
- **Issue:** `FinancialPlanReport.tsx` referenced `plan.currentAge` and `plan.income.salary`; `simulation/page.tsx` passed `plan.currentAge` to YearByYearTable
- **Fix:** PDF now shows primary person name and derived total income; simulation page derives age from birthdate
- **Files modified:** `src/components/pdf/FinancialPlanReport.tsx`, `src/app/simulation/page.tsx`
- **Commit:** 369a225

**3. [Rule 1 - Bug] Updated planDefaults test**
- **Found during:** Task 1
- **Issue:** `planDefaults.test.ts` asserted `income.salary` and `income.otherAnnualIncome` which no longer exist
- **Fix:** Updated test to assert `income.annualSavingsRate` and `people` array instead
- **Files modified:** `src/lib/__tests__/planDefaults.test.ts`
- **Commit:** 369a225

## Known Stubs

None — all data flows are wired. The people step writes to `plan.people` and the simulation engine reads from it directly.

## Self-Check: PASSED

All key files exist and all commits are present in git history.
