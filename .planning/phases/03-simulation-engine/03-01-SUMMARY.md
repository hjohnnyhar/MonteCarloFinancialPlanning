---
phase: 03-simulation-engine
plan: 01
subsystem: simulation
tags: [monte-carlo, typescript, vitest, financial-math, box-muller]

# Dependency graph
requires:
  - phase: 02-interview-wizard
    provides: FinancialPlan data model, wizard steps, goal types, riskTolerance

provides:
  - Pure Monte Carlo simulation engine in src/lib/simulation.ts
  - currentAge field on FinancialPlan type and wizard step
  - 15 unit tests covering correctness, performance, overrides, edge cases
  - SimulationOverrides interface for what-if scenarios
  - RETURN_ASSUMPTIONS constants for all 3 risk levels

affects:
  - 03-02 (simulation API route and plan results UI)
  - Any component displaying simulation results or goal probabilities

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure function pattern for simulation — no side effects, no I/O, testable in isolation
    - Box-Muller transform for normally distributed random returns
    - Iteration-level AND logic for joint success probability across goals
    - Portfolio clamping to 0 (no negative wealth in simulation)
    - SimulationOverrides pattern for what-if scenario analysis

key-files:
  created:
    - src/lib/simulation.ts
    - src/lib/__tests__/simulation.test.ts
  modified:
    - src/lib/types.ts (currentAge field on FinancialPlan)
    - src/lib/planDefaults.ts (currentAge: 0 in createEmptyPlan)
    - src/lib/wizardSchemas.ts (currentAge validation in incomeExpensesSchema)
    - src/components/interview/steps/IncomeExpensesStep.tsx (Current Age input)
    - vitest.config.ts (added @/ path alias)

key-decisions:
  - "runSimulation is pure function — no side effects, no I/O, accepts plan + optional overrides"
  - "Iteration-level AND for overallProbability — all goals must succeed in same iteration (not average of per-goal)"
  - "Box-Muller with Math.max(Number.EPSILON, Math.random()) guard prevents log(0) = -Infinity"
  - "currentAge placed as top-level field on FinancialPlan (not nested in metadata or income)"
  - "vitest.config.ts needed @/ path alias added to resolve tsconfig paths in test files"

patterns-established:
  - "Simulation as pure function: runSimulation(plan, overrides?) => SimulationResults"
  - "RETURN_ASSUMPTIONS record keyed by RiskToleranceLevel for risk-calibrated returns"
  - "SimulationOverrides interface enables what-if analysis without mutating plan"

requirements-completed: [SIM-01, SIM-02, SIM-03]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 3 Plan 1: Simulation Engine Summary

**10,000-iteration Monte Carlo engine with Box-Muller normal returns, per-goal probabilities, iteration-level AND for joint success, and currentAge data model field**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T01:53:54Z
- **Completed:** 2026-03-29T01:57:35Z
- **Tasks:** 2 (plus RED+GREEN TDD phases)
- **Files modified:** 7

## Accomplishments

- Added `currentAge` field to `FinancialPlan`, wizard schema (min 18, max 120), defaults, and the IncomeExpensesStep form — resolving the "Age Gap" blocker for retirement projection
- Built pure `runSimulation()` function handling all 4 goal types (retirement, purchase, education, legacy), with accumulation/decumulation phases and portfolio-floor clamping
- 15 unit tests pass in ~1s, covering: return shape, probability bounds, goal count ordering, per-goal probabilities, iteration-level AND logic, override scenarios, performance (<5s), funding gap non-negativity, and edge cases

## Task Commits

1. **Task 1: Add currentAge to data model, defaults, schema, wizard** - `6839ddd` (feat)
2. **Task 2 RED: Failing simulation tests** - `87b2d50` (test)
3. **Task 2 GREEN: Implement simulation engine** - `17bea78` (feat)

## Files Created/Modified

- `src/lib/simulation.ts` — Pure Monte Carlo engine: randNormal, resolveAssumptions, buildGoalDescriptors, simulateOnePath, runSimulation; exports SimulationOverrides, RETURN_ASSUMPTIONS, INFLATION_RATE, ITERATION_COUNT
- `src/lib/__tests__/simulation.test.ts` — 15 unit tests for simulation engine
- `src/lib/types.ts` — Added `currentAge: number` to FinancialPlan interface
- `src/lib/planDefaults.ts` — Added `currentAge: 0` to createEmptyPlan
- `src/lib/wizardSchemas.ts` — Added `currentAge` field with min/max validation to incomeExpensesSchema
- `src/components/interview/steps/IncomeExpensesStep.tsx` — Current Age input at top of form
- `vitest.config.ts` — Added `@/` path alias (deviation fix)

## Decisions Made

- `runSimulation` is a pure function — no I/O, accepts `plan` + optional `overrides`, returns deterministic structure
- Overall probability uses iteration-level AND: `allMetCount / ITERATION_COUNT` — all goals must succeed in the same iteration
- Box-Muller with `Math.max(Number.EPSILON, Math.random())` guard prevents `log(0) = -Infinity` crash
- `currentAge` is a top-level field on `FinancialPlan` (not nested), consistent with how simulation needs it
- `SimulationOverrides` interface enables what-if scenarios: annualSavingsRate, retirementAge, returnMean, returnStdDev

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @/ path alias to vitest.config.ts**
- **Found during:** Task 2 GREEN (implementing simulation.ts, running tests)
- **Issue:** Test file used `@/lib/simulation` import path as specified in plan, but vitest.config.ts had no resolve.alias for `@/` — tests failed with "Cannot find package '@/lib/simulation'"
- **Fix:** Added `resolve.alias: { '@': path.resolve(__dirname, './src') }` to vitest.config.ts, matching the existing tsconfig.json `paths` entry
- **Files modified:** vitest.config.ts
- **Verification:** All 15 tests pass, all 31 tests across full suite pass
- **Committed in:** `17bea78` (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Essential for test infrastructure to work. The fix aligns vitest with the existing tsconfig path configuration. No scope creep.

## Issues Encountered

None beyond the path alias deviation above.

## Known Stubs

None — all simulation logic is fully implemented. The `fundingGap` calculation is a simplification (today's target minus initial portfolio as a proxy) but is a valid non-negative number for every goal.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `runSimulation(plan)` is ready to be called from the API route
- `SimulationOverrides` is ready for what-if UI controls in 03-02
- All types exported and TypeScript-clean
- No blockers for 03-02 (simulation API route + results UI)

---
*Phase: 03-simulation-engine*
*Completed: 2026-03-29*
