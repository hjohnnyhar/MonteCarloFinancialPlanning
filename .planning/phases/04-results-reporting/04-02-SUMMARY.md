---
phase: 04-results-reporting
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, simulation, components]

# Dependency graph
requires:
  - phase: 04-results-reporting/04-01
    provides: scoreTier, recommendations[], yearlyProjection[] on SimulationResults

provides:
  - Color-coded headline score with tier label and explanation sentence
  - RecommendationsCard component rendering 3 actionable recommendations with amounts
  - YearByYearTable component with collapsible year-by-year projection
  - Shared formatters module (formatCurrency, formatGoalType)

affects:
  - 04-03-pdf-report (will import formatters and component patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Shared formatter functions in src/lib/formatters.ts for cross-component reuse
    - Collapsible section pattern via useState toggle with Unicode chevron
    - Conditional rendering pattern for optional SimulationResults fields

key-files:
  created:
    - src/components/simulation/RecommendationsCard.tsx
    - src/components/simulation/YearByYearTable.tsx
    - src/lib/formatters.ts
  modified:
    - src/app/simulation/page.tsx

key-decisions:
  - "formatCurrency and formatGoalType extracted to src/lib/formatters.ts so PDF component (04-03) can share them without circular imports"
  - "YearByYearTable collapsed by default per D-11 — user must click to expand projection table"

patterns-established:
  - "Collapsible toggle: useState(false) + button with chevron Unicode &#9660;/&#9650;"
  - "Shared formatters in src/lib/formatters.ts for cross-component currency/type formatting"

requirements-completed: [RSLT-01, RSLT-02, RSLT-03]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 04 Plan 02: Enhanced simulation page UI with headline, recommendations, and projection Summary

**Color-coded headline score with tier label, 3-item recommendations card, and collapsible year-by-year projection table wired into the /simulation page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T03:00:26Z
- **Completed:** 2026-03-29T03:02:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Headline score card now shows color-coded percentage (green/amber/red) with tier label and explanation sentence
- New RecommendationsCard component renders up to 3 actionable recommendations with lever labels and current/suggested values
- New YearByYearTable component renders collapsible year-by-year projection with milestone row highlighting (bg-blue-50)
- Shared formatters.ts enables formatCurrency and formatGoalType to be imported by the upcoming PDF component without duplication

## Task Commits

Each task was committed atomically:

1. **Task 1: Polish headline score with color coding and tier label** - `d104fc7` (feat)
2. **Task 2: Add recommendations, year-by-year table, and shared formatters** - `5034601` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/app/simulation/page.tsx` - Added color-coded headline, imports new components, uses shared formatters
- `src/components/simulation/RecommendationsCard.tsx` - New component: numbered recommendations with lever labels
- `src/components/simulation/YearByYearTable.tsx` - New component: collapsible year-by-year table with milestone highlighting
- `src/lib/formatters.ts` - New shared module: formatCurrency and formatGoalType extracted from page.tsx

## Decisions Made
- Extracted formatters to `src/lib/formatters.ts` so the upcoming PDF report component (04-03) can import them without pulling in React UI code
- YearByYearTable defaults to collapsed state per D-11 specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All enhanced UI components are in place; /simulation page now shows the full results experience
- formatters.ts provides clean foundation for 04-03 (PDF report) to reuse currency/goal-type formatting
- WhatIfPanel unchanged and still functional; what-if re-runs update all new sections

## Known Stubs

None - all data flows from SimulationResults are real computed values from the simulation engine.

## Self-Check: PASSED

- RecommendationsCard.tsx: FOUND
- YearByYearTable.tsx: FOUND
- formatters.ts: FOUND
- 04-02-SUMMARY.md: FOUND
- Commit d104fc7: FOUND
- Commit 5034601: FOUND

---
*Phase: 04-results-reporting*
*Completed: 2026-03-29*
