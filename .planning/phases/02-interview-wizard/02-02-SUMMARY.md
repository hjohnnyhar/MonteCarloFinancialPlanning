---
phase: 02-interview-wizard
plan: "02"
subsystem: ui
tags: [react, next.js, react-hook-form, zod, typescript, tailwind]

# Dependency graph
requires:
  - phase: 02-01
    provides: wizardStore, wizardSchemas, wizardSteps, Sidebar with useSyncExternalStore wiring

provides:
  - /interview page (InterviewPage) with WizardShell, step routing, resume logic, Sidebar sync
  - WizardShell presentational component with progress bar and children slot
  - IncomeExpensesStep form (6 fields: 3 income, 3 expenses) with D-04 warn-but-allow validation
  - AssetsLiabilitiesStep form (10 fields: 5 assets, 5 liabilities) with D-04 warn-but-allow validation

affects: [02-03, 02-04, interview-wizard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Step components own their own Back/Next navigation buttons — WizardShell is purely presentational chrome"
    - "D-04 warn-but-allow: trigger() displays inline errors, getValues() advances regardless"
    - "Pitfall 2 fix: useEffect reset() re-populates form from plan data on load (INT-08)"
    - "Bidirectional Sidebar sync: useSyncExternalStore reads wizardStore, useEffect writes stepIndex back"
    - "Resume pattern: hasResumed.current ref prevents double-restoring step on re-renders"

key-files:
  created:
    - src/app/interview/page.tsx
    - src/components/interview/WizardShell.tsx
    - src/components/interview/steps/IncomeExpensesStep.tsx
    - src/components/interview/steps/AssetsLiabilitiesStep.tsx
  modified: []

key-decisions:
  - "WizardShell has no nav buttons — each step owns its navigation so steps can control form submission timing (D-04)"
  - "Resume logic uses hasResumed ref to avoid re-restoring step on every re-render of the plan object"
  - "Bidirectional store sync: page reads externalStepIndex from useSyncExternalStore to catch Sidebar clicks"

patterns-established:
  - "Step component interface: { plan, onComplete, onBack } — consistent across all wizard steps"
  - "Navigation button row: flex items-center justify-between with border-t border-gray-200 at bottom of each step"

requirements-completed: [INT-01, INT-02, INT-03, INT-06, INT-08]

# Metrics
duration: 20min
completed: 2026-03-29
---

# Phase 02 Plan 02: Interview Wizard Page, Shell, and First Two Steps Summary

**Multi-step interview wizard at /interview with progress bar, resume-from-saved-step, and data-entry forms for Income/Expenses and Assets/Liabilities — all wired to usePlan for persistence**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-29T00:45:00Z
- **Completed:** 2026-03-29T01:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- WizardShell component renders progress bar ("Step N of 5"), step title, step description, and a children slot — no nav buttons (per D-04 design decision)
- InterviewPage at /interview manages step state, syncs bidirectionally with Sidebar via wizardStore, resumes from saved wizardStep on reload (INT-06), and pre-populates forms from existing plan data (INT-08)
- IncomeExpensesStep and AssetsLiabilitiesStep implement D-04 warn-but-allow pattern: trigger() shows inline validation errors, getValues() advances regardless
- All 16 fields (6 income/expense, 10 assets/liabilities) render with proper labels, inputMode="decimal", and aria-invalid/aria-describedby accessibility attributes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create InterviewPage and WizardShell** - `9fed6a4` (feat)
2. **Task 2: Create IncomeExpensesStep and AssetsLiabilitiesStep** - `4ca818c` (feat)

## Files Created/Modified

- `src/app/interview/page.tsx` — Interview page: step state management, resume logic, wizardStore sync, renders WizardShell with active step
- `src/components/interview/WizardShell.tsx` — Presentational chrome: progress bar with aria-valuenow, step title, children slot (no nav buttons)
- `src/components/interview/steps/IncomeExpensesStep.tsx` — Income & Expenses form with 6 fields, zodResolver, warn-but-allow, pre-populate from plan
- `src/components/interview/steps/AssetsLiabilitiesStep.tsx` — Assets & Liabilities form with 10 fields, zodResolver, warn-but-allow, pre-populate from plan

## Decisions Made

- WizardShell has no navigation buttons so each step can control its own form submission timing (calling trigger() before getValues()), per D-04 decision from UI-SPEC
- Resume logic uses a `hasResumed.current` ref to fire only once on initial load, preventing double-restoration when plan re-renders
- Bidirectional Sidebar sync: page uses useSyncExternalStore to catch external step changes (from Sidebar clicks) and syncs them back into local stepIndex state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

- Steps 2, 3, 4 (Financial Goals, Risk Tolerance, Review & Confirm) render placeholder `<div>` elements saying "Coming soon — will be built in Plan 03/04". These are intentional stubs per the plan spec; Plans 03 and 04 will replace them.

## Next Phase Readiness

- Plan 03 can import WizardShell and the established StepProps interface to build GoalsStep and RiskToleranceStep
- Plan 04 can build ReviewStep using the same pattern
- The /interview route is fully functional for the first two steps — users can fill in Income/Expenses and Assets/Liabilities, navigate Back/Next, and resume on reload

---
*Phase: 02-interview-wizard*
*Completed: 2026-03-29*
