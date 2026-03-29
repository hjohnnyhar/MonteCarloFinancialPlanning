# Phase 3: Simulation Engine - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Monte Carlo simulation engine: a POST /api/simulate endpoint that takes the completed financial profile and returns per-goal probability scores plus an overall plan score. Wire auto-trigger on wizard completion and a what-if panel on the simulation page for re-runs with adjusted assumptions.

Simulation math and results storage are in scope. Results display UI (goal breakdown, headline score, recommendations) belongs to Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Execution Architecture
- **D-01:** Simulation runs server-side via `POST /api/simulate` — consistent with the existing `/api/plan` route pattern. No Web Workers needed.
- **D-02:** 10,000 Monte Carlo iterations per run. Produces stable probability scores (~1-2s in Node.js, well inside the <5s target).

### Statistical Model
- **D-03:** Market returns modeled as log-normal (normal distribution). Each simulated year draws a return from N(mean, stdDev) using the risk level's parameters.
- **D-04:** Inflation modeled separately at ~3% annually (nominal return assumptions, not real).
- **D-05:** Return assumptions by risk level — Claude's discretion using industry-standard defaults (e.g., Vanguard/Morningstar long-run estimates). Approximately: Conservative ~5%/8%, Moderate ~7%/12%, Aggressive ~9%/16% (nominal, annualized).

### Trigger & UX Flow
- **D-06:** Simulation auto-runs on wizard completion. When the user clicks "Save & Run Simulation" in the Review step, the app navigates immediately to `/simulation` and fires `POST /api/simulate` on page load.
- **D-07:** Loading state lives on the `/simulation` page — show spinner/skeleton while the API call is in flight. User sees the destination immediately, results populate when ready.

### What-If Adjustments (SIM-04)
- **D-08:** What-if panel lives on the `/simulation` page alongside results.
- **D-09:** Three adjustable levers: savings rate (%), retirement age (years), and market return assumption (risk level selector or return % override).
- **D-10:** Each what-if adjustment fires `POST /api/simulate` with the overridden parameters and updates the displayed results in-place.

### Claude's Discretion
- Exact return/volatility numbers for each risk level (use reasonable academic defaults)
- How funding gap is computed per goal (present-value shortfall vs nominal)
- Projection horizon derivation (e.g., retirement goal → years until retirement age + years in retirement)
- How legacy goals without a target year are handled (treat as end-of-plan balance target)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model
- `src/lib/types.ts` — `SimulationResults`, `GoalResult`, `FinancialPlan`, `RiskTolerance` types are already defined. Engine must produce output matching `SimulationResults` exactly.

### Risk Scoring
- `src/lib/riskToleranceQuestions.ts` — `scoreFromAnswers()` and `deriveRiskLevel()` already defined. Simulation uses `riskTolerance.level` to select return assumptions.

### Existing API Pattern
- `src/app/api/plan/` — Existing GET/PUT route pattern. New `POST /api/simulate` should follow the same structure.

### Requirements
- `.planning/REQUIREMENTS.md` §Simulation — SIM-01 through SIM-04 define the acceptance criteria.

### Project Constraints
- `.planning/PROJECT.md` §Constraints — <5s simulation performance is a hard requirement.

</canonical_refs>

<deferred>
## Deferred Ideas

None raised during discussion.

</deferred>
