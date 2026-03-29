---
phase: 02-interview-wizard
plan: 03
subsystem: ui
tags: [react, react-hook-form, zod, typescript, interview-wizard]

# Dependency graph
requires:
  - phase: 02-interview-wizard/02-02
    provides: WizardShell, usePlan hook, interview page with step routing
  - phase: 02-interview-wizard/02-01
    provides: wizardSchemas with goal schemas, types.ts with Goal interfaces
provides:
  - GoalsStep component with 4-tab goal management (Retirement, Purchases, Education, Legacy)
  - RetirementGoalForm, PurchaseGoalForm, EducationGoalForm, LegacyGoalForm inline forms
  - Full add/edit/remove goal workflow with immediate persistence via updatePlan
affects: [03-simulation, plan-output]

# Tech tracking
tech-stack:
  added: [react-hook-form (installed), @hookform/resolvers (installed)]
  patterns: [zodResolver type cast for v5 coerce compatibility, inline form expansion pattern, tab-based sub-navigation]

key-files:
  created:
    - src/components/interview/steps/GoalsStep.tsx
    - src/components/interview/goals/RetirementGoalForm.tsx
    - src/components/interview/goals/PurchaseGoalForm.tsx
    - src/components/interview/goals/EducationGoalForm.tsx
    - src/components/interview/goals/LegacyGoalForm.tsx
  modified:
    - src/app/interview/page.tsx
    - src/components/interview/steps/IncomeExpensesStep.tsx
    - src/components/interview/steps/AssetsLiabilitiesStep.tsx

key-decisions:
  - "zodResolver v5 with z.coerce.number() requires as unknown as Resolver<T> cast — module-level variable pattern avoids TS2322"
  - "GoalsStep receives updatePlan directly (not just onComplete) so goal add/remove saves immediately without waiting for Next click"
  - "Inline confirmation for remove using role=alertdialog with Yes remove / Keep it per UI-SPEC copywriting contract"
  - "editingIndex uses global goal array index (not filtered tab index) to correctly map edits back to plan.goals"

patterns-established:
  - "Inline form expansion: isAdding/editingIndex state + blue-50 bg-blue-200 border container per UI-SPEC"
  - "Goal forms use module-level resolver variable to sidestep hookform/resolvers v5 type inference issue with z.coerce"
  - "Tab reset: switching tabs clears editingIndex and isAdding to avoid cross-tab form confusion"

requirements-completed: [INT-04]

# Metrics
duration: 35min
completed: 2026-03-28
---

# Phase 02 Plan 03: Financial Goals Wizard Step Summary

**Tabbed goals wizard step with 4 goal-type forms (Retirement, Purchases, Education, Legacy), inline add/edit/remove, and immediate persistence via updatePlan**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-28T00:00:00Z
- **Completed:** 2026-03-28
- **Tasks:** 2
- **Files modified:** 8 (5 created, 3 modified)

## Accomplishments

- GoalsStep renders 4 tabs (Retirement, Purchases, Education, Legacy) with goal lists, add/edit/remove, and empty state
- All 4 goal forms implement their type-specific fields with zod validation and immediate save
- Remove flow uses inline confirmation (not browser confirm dialog) with role=alertdialog for accessibility
- Zero goals is valid (D-02) — empty state is informational, not blocking navigation
- Multiple goals per type supported (D-03) — each add appends to goals array

## Task Commits

Each task was committed atomically:

1. **Task 1: GoalsStep with tabbed navigation and goal list management** - `645169a` (feat)
2. **Task 2: 4 goal-type-specific inline forms** - `5cb2c2e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/interview/steps/GoalsStep.tsx` - Tabbed goals step with add/edit/remove and inline confirmation
- `src/components/interview/goals/RetirementGoalForm.tsx` - Retirement goal form (age, income, years)
- `src/components/interview/goals/PurchaseGoalForm.tsx` - Purchase goal form (description, amount, year)
- `src/components/interview/goals/EducationGoalForm.tsx` - Education goal form (beneficiary, amount, year)
- `src/components/interview/goals/LegacyGoalForm.tsx` - Legacy goal form (description, amount)
- `src/app/interview/page.tsx` - Added GoalsStep import and replaced placeholder at case 2
- `src/components/interview/steps/IncomeExpensesStep.tsx` - Fixed zodResolver v5 type cast (Rule 1)
- `src/components/interview/steps/AssetsLiabilitiesStep.tsx` - Fixed zodResolver v5 type cast (Rule 1)

## Decisions Made

- `zodResolver v5` with `z.coerce.number()` produces `Resolver<unknown, ...>` instead of `Resolver<number, ...>` — TypeScript's `as unknown as Resolver<T>` cast on a module-level variable resolves the TS2322 error cleanly
- GoalsStep accepts `updatePlan` as a direct prop (not just via onComplete) so that goal mutations save immediately, before the user clicks Next
- The `editingIndex` tracks the **global** index in `plan.goals` (not the filtered per-tab index) to correctly update and not cross-contaminate goals across types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed react-hook-form and @hookform/resolvers packages**
- **Found during:** Task 1 (creating GoalsStep)
- **Issue:** Both packages were listed in package.json but not installed — tsc reported TS2307 "Cannot find module 'react-hook-form'"
- **Fix:** Ran `npm install` to install all missing dependencies
- **Files modified:** node_modules (not committed)
- **Verification:** tsc no longer reported TS2307
- **Committed in:** 645169a (Task 1 commit)

**2. [Rule 1 - Bug] Fixed zodResolver v5 type compatibility in IncomeExpensesStep and AssetsLiabilitiesStep**
- **Found during:** Task 1 (running tsc after installing packages)
- **Issue:** @hookform/resolvers v5 changed resolver type inference — z.coerce fields produce `unknown` input type, causing TS2322 on the `resolver:` property
- **Fix:** Added `Resolver` type import and module-level cast `as unknown as Resolver<FormData>` for both pre-existing steps and all new goal forms
- **Files modified:** IncomeExpensesStep.tsx, AssetsLiabilitiesStep.tsx (both project root and worktree)
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 645169a (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking install, 1 pre-existing bug)
**Impact on plan:** Both auto-fixes were necessary for compilation. No scope creep.

## Issues Encountered

- Project root tsconfig `**/*.tsx` glob picks up worktree files, so TSC must be run from project root to verify both. Pre-existing files in project root also needed the resolver cast fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Goals step fully functional — users can add/edit/remove all 4 goal types
- Goal data persists to plan.json via updatePlan (auto-save)
- Ready for Plan 04: Risk Tolerance step
- Ready for Plan 05: Review & Confirm step

## Self-Check: PASSED

- FOUND: src/components/interview/steps/GoalsStep.tsx
- FOUND: src/components/interview/goals/RetirementGoalForm.tsx
- FOUND: src/components/interview/goals/PurchaseGoalForm.tsx
- FOUND: src/components/interview/goals/EducationGoalForm.tsx
- FOUND: src/components/interview/goals/LegacyGoalForm.tsx
- FOUND: commit 645169a (Task 1)
- FOUND: commit 5cb2c2e (Task 2)

---
*Phase: 02-interview-wizard*
*Completed: 2026-03-28*
