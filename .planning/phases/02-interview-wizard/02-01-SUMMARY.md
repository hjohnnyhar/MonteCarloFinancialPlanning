---
phase: 02-interview-wizard
plan: 01
subsystem: ui
tags: [react-hook-form, zod, wizard, forms, validation, pub-sub]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "FinancialPlan types, planDefaults, usePlan hook, Sidebar component, dashboard page"
provides:
  - "react-hook-form, @hookform/resolvers, zod installed as direct dependencies"
  - "wizardStep field on PlanMetadata (persists step index to JSON)"
  - "Per-step zod schemas for all 4 data steps (income/expenses, assets/liabilities, goals, risk tolerance)"
  - "WIZARD_STEPS config array with 5 step definitions"
  - "RISK_QUESTIONS bank with 4 questions and scoreFromAnswers/deriveRiskLevel scoring functions"
  - "wizardStore pub/sub for cross-component wizard state (Sidebar + InterviewPage)"
  - "Sidebar conditionally renders wizard step list on /interview route"
  - "Dashboard has Start Interview button linking to /interview"
affects:
  - "02-02-interview-step-components"
  - "02-03-interview-page"

# Tech tracking
tech-stack:
  added: [react-hook-form@7.72.0, "@hookform/resolvers@5.2.2", zod@3.x]
  patterns:
    - "useSyncExternalStore pattern for cross-tree component state (wizardStore)"
    - "z.coerce.number() for currency/numeric form fields from text inputs"
    - "Conditional Sidebar rendering based on usePathname()"

key-files:
  created:
    - src/lib/wizardSchemas.ts
    - src/lib/wizardSteps.ts
    - src/lib/riskToleranceQuestions.ts
    - src/lib/wizardStore.ts
  modified:
    - src/lib/types.ts
    - src/lib/planDefaults.ts
    - src/lib/__tests__/planDefaults.test.ts
    - src/components/Sidebar.tsx
    - src/app/page.tsx

key-decisions:
  - "wizardStore uses useSyncExternalStore pattern because Sidebar is rendered outside InterviewPage component tree — React context in the page would not be visible to the Sidebar"
  - "z.coerce.number() used for all currency/numeric zod schema fields since they come from HTML text inputs"
  - "Sidebar converts to 'use client' to enable usePathname and useSyncExternalStore hooks"

patterns-established:
  - "External pub/sub store: modules-level variables with Set<Listener> for cross-tree state, consumed via useSyncExternalStore"
  - "Conditional sidebar rendering: usePathname() === route check drives what the sidebar renders"

requirements-completed: [INT-01, INT-06, INT-08]

# Metrics
duration: 8min
completed: 2026-03-28
---

# Phase 02 Plan 01: Interview Wizard Infrastructure Summary

**Zod validation schemas, wizard step config, risk questionnaire bank, and cross-component pub/sub store wired to a conditionally-rendering Sidebar and a Start Interview button on the dashboard**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-28T20:39:00Z
- **Completed:** 2026-03-28T20:41:50Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Installed react-hook-form, @hookform/resolvers, and zod as direct dependencies
- Added wizardStep to PlanMetadata (persisted wizard progress) with test coverage
- Created all 7 per-step zod schemas covering every data field in the interview
- Created WIZARD_STEPS config (5 steps) and RISK_QUESTIONS bank (4 questions, scoring functions)
- Built wizardStore pub/sub enabling cross-component wizard state without React context
- Sidebar now renders wizard step list (active/completed/future states) on /interview route
- Dashboard shows Start Interview button linking to /interview

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps and add wizardStep to data model** - `457203f` (feat)
2. **Task 2: Create wizard schemas, step config, and risk tolerance questions** - `b940f6a` (feat)
3. **Task 3: Create wizardStore, wire Sidebar, add Start Interview button** - `550e3b4` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Added wizardStep?: number to PlanMetadata
- `src/lib/planDefaults.ts` - wizardStep: 0 in createEmptyPlan()
- `src/lib/__tests__/planDefaults.test.ts` - Added wizardStep defaults to 0 test
- `src/lib/wizardSchemas.ts` - Per-step zod schemas for all 4 data steps + type exports
- `src/lib/wizardSteps.ts` - WIZARD_STEPS array with 5 step configs
- `src/lib/riskToleranceQuestions.ts` - RISK_QUESTIONS bank with scoreFromAnswers and deriveRiskLevel
- `src/lib/wizardStore.ts` - Lightweight pub/sub store for wizard step index and completed steps
- `src/components/Sidebar.tsx` - Client component with conditional wizard/normal nav rendering
- `src/app/page.tsx` - Added Start Interview Link button

## Decisions Made
- Used wizardStore pub/sub pattern (not React context) because Sidebar is rendered by AppShell outside InterviewPage component tree — context from the interview page would not be visible to Sidebar
- z.coerce.number() for all currency/numeric schema fields since HTML text inputs always produce strings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All contracts are in place for plan 02-02 (interview step components):
- All zod schemas exported from wizardSchemas.ts for react-hook-form integration
- WIZARD_STEPS defines 5 steps with ids the InterviewPage will use for routing
- wizardStore.setStepIndex / setCompletedSteps ready for InterviewPage to call
- Sidebar renders wizard nav reactively — InterviewPage just needs to write to wizardStore

---
*Phase: 02-interview-wizard*
*Completed: 2026-03-28*
