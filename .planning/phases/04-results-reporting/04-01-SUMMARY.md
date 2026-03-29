---
phase: 04-results-reporting
plan: "01"
subsystem: api
tags: [monte-carlo, simulation, recommendations, typescript]

# Dependency graph
requires:
  - phase: 03-simulation-engine
    provides: runSimulation pure function, SimulationResults type, GoalResult type
provides:
  - computeScoreTier function (green/amber/red tier based on probability)
  - computeRecommendations function (4 levers, top-3 sorted by impact)
  - extractMedianPath function (1k-iteration year-by-year median portfolio path)
  - Extended SimulationResults type (recommendations, yearlyProjection, scoreTier)
  - /api/simulate now returns all three new fields automatically
affects:
  - 04-results-reporting (plans 02 and 03 consume the new fields for UI and PDF)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lightweight re-simulation at 2k iterations per lever for recommendations (performance)
    - Median-path extraction via 1k-iteration portfolio arrays with sorted median
    - Optional fields on SimulationResults so existing tests are not broken

key-files:
  created:
    - src/lib/__tests__/recommendations.test.ts
    - src/lib/__tests__/yearly-projection.test.ts
  modified:
    - src/lib/types.ts
    - src/lib/simulation.ts

key-decisions:
  - "computeRecommendations uses 2k iterations per lever (not 10k) — keeps total time under 5s while still producing meaningful scores"
  - "Recommendations sorted by projectedScore descending, capped at 3 — aligns with D-07"
  - "goal_reduction lever skips retirement goals — only non-retirement goals have a targetAmount field to reduce"
  - "extractMedianPath uses 1k iterations with per-year sorted array for O(n log n) median — straightforward and fast"
  - "New SimulationResults fields are optional — zero impact on existing tests and existing callers that don't use them"

patterns-established:
  - "Lightweight sim helper: runLightweightSim() shares all derived-value setup logic with runSimulation() via shared helpers"

requirements-completed: [RSLT-01, RSLT-02, RSLT-03]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 4 Plan 01: Extend Simulation Engine with Recommendations and Yearly Projection Summary

**Monte Carlo engine extended with computeScoreTier, computeRecommendations (4 levers, 2k iterations each), and extractMedianPath (1k-iteration median portfolio path) — all wired into runSimulation and returned by /api/simulate**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T02:54:31Z
- **Completed:** 2026-03-29T02:58:30Z
- **Tasks:** 3
- **Files modified:** 4 (2 modified, 2 created)

## Accomplishments

- Extended `SimulationResults` type with three optional fields (`recommendations`, `yearlyProjection`, `scoreTier`) — no breaking changes
- Implemented `computeScoreTier` (green/amber/red thresholds at 0.8/0.6), `computeRecommendations` (4 levers, top-3 by impact), and `extractMedianPath` (year-by-year median portfolio with goal milestone markers)
- Added 20 unit tests across two new test files; all 51 project tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types** - `d4784b9` (feat)
2. **Task 2: Recommendations engine and median path** - `3468ea3` (feat)
3. **Task 3: Unit tests** - `cc932c9` (test)

## Files Created/Modified

- `src/lib/types.ts` - Added Recommendation, YearlySnapshot, ScoreTier interfaces; extended SimulationResults with three optional fields
- `src/lib/simulation.ts` - Added computeScoreTier, computeRecommendations, extractMedianPath, runLightweightSim; updated runSimulation to call all three
- `src/lib/__tests__/recommendations.test.ts` - 11 tests for score tier boundaries, recommendation sorting, lever behavior
- `src/lib/__tests__/yearly-projection.test.ts` - 9 tests for snapshot count, field types, goal milestones, accumulation/decumulation phases

## Decisions Made

- `computeRecommendations` uses 2k iterations per lever (not 10k) — total overhead ~8k iterations keeps full simulation well under 5s (measured ~220-440ms per full call in tests)
- `goal_reduction` lever skips retirement goals — only non-retirement goals have a `targetAmount` field to reduce; retirement goals are captured by `retirement_delay` lever
- New `SimulationResults` fields are optional (`?`) — existing tests don't need to assert on them, and callers that don't use them are unaffected
- `extractMedianPath` snapshot at `yearIdx` has `age = currentAge + yearIdx + 1` (end-of-year convention), so decumulation appears starting at age `retirementAge + 1` in snapshots

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed off-by-one in yearly projection test for decumulation boundary**
- **Found during:** Task 3 (unit tests)
- **Issue:** Test asserted `age >= 65` for decumulation but snapshot convention is end-of-year, so age 65 = yearIdx 29 = last accumulation year; decumulation starts at age 66
- **Fix:** Corrected test filters to `age <= 65` for accumulation and `age > 65` for decumulation, matching the simulation's `yearIdx < yearsToRetirement` boundary
- **Files modified:** src/lib/__tests__/yearly-projection.test.ts
- **Verification:** All 9 yearly-projection tests pass
- **Committed in:** cc932c9 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test boundary logic)
**Impact on plan:** Minor — test logic clarification only, no production code change.

## Issues Encountered

None — simulation code executed cleanly on first run; only test boundary needed correction.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three new fields (`scoreTier`, `recommendations`, `yearlyProjection`) are live in `/api/simulate` response
- Phase 04-02 can consume `scoreTier` and `recommendations` for the results dashboard UI
- Phase 04-03 can use `yearlyProjection` for the portfolio projection chart and PDF export

---
*Phase: 04-results-reporting*
*Completed: 2026-03-29*

## Self-Check: PASSED

- All 4 key files exist on disk
- All 3 task commits confirmed in git log (d4784b9, 3468ea3, cc932c9)
- 51 tests pass with no regressions
