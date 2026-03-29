# Phase 3: Simulation Engine - Research

**Researched:** 2026-03-28
**Domain:** Monte Carlo financial simulation, Next.js API routes, TypeScript
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Simulation runs server-side via `POST /api/simulate` — consistent with the existing `/api/plan` route pattern. No Web Workers needed.
- **D-02:** 10,000 Monte Carlo iterations per run. Produces stable probability scores (~1-2s in Node.js, well inside the <5s target).
- **D-03:** Market returns modeled as log-normal (normal distribution). Each simulated year draws a return from N(mean, stdDev) using the risk level's parameters.
- **D-04:** Inflation modeled separately at ~3% annually (nominal return assumptions, not real).
- **D-05:** Return assumptions by risk level — Claude's discretion using industry-standard defaults (e.g., Vanguard/Morningstar long-run estimates). Approximately: Conservative ~5%/8%, Moderate ~7%/12%, Aggressive ~9%/16% (nominal, annualized).
- **D-06:** Simulation auto-runs on wizard completion. When the user clicks "Save & Run Simulation" in the Review step, the app navigates immediately to `/simulation` and fires `POST /api/simulate` on page load.
- **D-07:** Loading state lives on the `/simulation` page — show spinner/skeleton while the API call is in flight. User sees the destination immediately, results populate when ready.
- **D-08:** What-if panel lives on the `/simulation` page alongside results.
- **D-09:** Three adjustable levers: savings rate (%), retirement age (years), and market return assumption (risk level selector or return % override).
- **D-10:** Each what-if adjustment fires `POST /api/simulate` with the overridden parameters and updates the displayed results in-place.

### Claude's Discretion

- Exact return/volatility numbers for each risk level (use reasonable academic defaults)
- How funding gap is computed per goal (present-value shortfall vs nominal)
- Projection horizon derivation (e.g., retirement goal → years until retirement age + years in retirement)
- How legacy goals without a target year are handled (treat as end-of-plan balance target)

### Deferred Ideas (OUT OF SCOPE)

None raised during discussion.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIM-01 | System runs Monte Carlo simulation with thousands of randomized market-return scenarios against the completed financial profile | Engine design section, return assumptions, Box-Muller algorithm |
| SIM-02 | Simulation produces a probability score per financial goal (e.g., "78% chance of funding retirement") | Per-goal projection math section, GoalResult type already defined |
| SIM-03 | Simulation produces an overall plan probability score across all goals | Overall score derivation section |
| SIM-04 | User can adjust key assumptions (savings rate, retirement age, spending) and re-run simulation to see updated scores (what-if) | What-if wiring section, SimulationOverrides type design |
</phase_requirements>

---

## Summary

Phase 3 builds the Monte Carlo simulation engine. The core deliverable is a `POST /api/simulate` Next.js API route that accepts a `FinancialPlan` plus optional what-if overrides, runs 10,000 log-normal market scenarios, and returns a `SimulationResults` object whose shape is already fully defined in `src/lib/types.ts`. A new `/simulation` page fires this endpoint on mount and displays a loading skeleton until results arrive. A what-if panel on the same page re-fires the endpoint when the user adjusts savings rate, retirement age, or return assumption.

The simulation math is straightforward iterative portfolio projection. Performance is not a concern: a benchmark of 10,000 iterations with a 40-year horizon in plain Node.js completes in ~44ms, orders of magnitude inside the <5s requirement. The only genuinely open design question is the **age gap**: the current `FinancialPlan` data model has no `currentAge` or date-of-birth field, yet the simulation needs "years until goal" for every goal. This must be resolved by adding a `currentAge` field to the plan — the research section documents exactly where and how.

**Primary recommendation:** Build a pure TypeScript simulation function in `src/lib/simulation.ts` that takes `(plan: FinancialPlan, overrides?: SimulationOverrides)` and returns `SimulationResults`. The API route is a thin wrapper that reads the plan, calls the function, persists results back to the JSON file, and returns. Keep all math in the pure function for testability.

---

## Project Constraints (from CLAUDE.md)

| Directive | Implication for this phase |
|-----------|---------------------------|
| TypeScript full-stack (React/Next.js + Node.js) | Simulation engine in `.ts`, API route is Next.js App Router pattern |
| Monte Carlo target <5s | Confirmed achievable — benchmark shows ~44ms for 10k x 40yr in Node.js |
| Financial data sensitivity — secure API design non-negotiable | POST /api/simulate must validate input; never expose raw errors to client |
| Follow existing patterns found in the codebase | Mirror `src/app/api/plan/route.ts` structure exactly |
| GSD workflow enforcement | No direct file edits outside GSD execute-phase |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.1 (already installed) | API route (`POST /api/simulate`), `/simulation` page | Matches existing codebase pattern |
| TypeScript | ^5 (already installed) | Simulation engine typing | Required by project constraints |
| React | 19.2.4 (already installed) | `/simulation` page, what-if panel UI | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Math.random()` + Box-Muller | built-in | Normal variate generation for log-normal returns | Sufficient for 10k iterations; no external dependency needed |
| Vitest | ^4.1.2 (already installed) | Unit tests for simulation engine | Test pure `runSimulation()` function with known inputs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Math.random()` Box-Muller | `jstat`, `ml-stat`, or `seedrandom` | External libs add no meaningful value here; Box-Muller is 4 lines of code and well-understood |
| Pure JS iteration | Web Workers | Web Workers add complexity; server-side route is already decided (D-01); Node.js is fast enough (44ms measured) |
| Saving results to JSON file | Returning without persisting | Persistence is required so Phase 4 can read results without re-running; matches DATA-03 requirement |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── simulation.ts          # Pure simulation function (new)
│   └── types.ts               # Already has SimulationResults, GoalResult, FinancialPlan
├── app/
│   ├── api/
│   │   └── simulate/
│   │       └── route.ts       # POST /api/simulate (new)
│   └── simulation/
│       └── page.tsx           # /simulation page — skeleton + results (new)
└── components/
    └── simulation/
        ├── SimulationSkeleton.tsx    # Loading skeleton (new)
        └── WhatIfPanel.tsx           # What-if controls (new)
```

### Pattern 1: Simulation Library Function (pure, testable)

**What:** All Monte Carlo math lives in `src/lib/simulation.ts` as a pure function with no I/O side effects.
**When to use:** Separates math from HTTP so both can be tested independently; matches pattern of `riskToleranceQuestions.ts` (pure library with no React dependencies).

```typescript
// src/lib/simulation.ts
export interface SimulationOverrides {
  annualSavingsRate?: number;    // 0–1
  retirementAge?: number;        // years
  returnMean?: number;           // nominal annual, e.g. 0.07
  returnStdDev?: number;
}

export function runSimulation(
  plan: FinancialPlan,
  overrides?: SimulationOverrides
): SimulationResults {
  // 1. Resolve assumptions (merge overrides over risk-level defaults)
  // 2. Derive currentAge (from plan.income or new field — see Age Gap section)
  // 3. For each of ITERATION_COUNT iterations:
  //    a. project portfolio year-by-year with random log-normal returns
  //    b. test each goal at its target year
  // 4. Per-goal: successCount / ITERATION_COUNT = probabilityScore
  // 5. overallProbability = harmonic mean or min (see Overall Score section)
  // 6. Return SimulationResults
}
```

### Pattern 2: POST /api/simulate Route (thin wrapper)

**What:** API route reads plan, calls `runSimulation`, persists results, returns JSON.
**When to use:** Consistent with `/api/plan` route structure. Thin glue only.

```typescript
// src/app/api/simulate/route.ts — mirrors src/app/api/plan/route.ts
import { NextResponse } from 'next/server';
import { readPlan, writePlan } from '@/lib/persistence';
import { runSimulation } from '@/lib/simulation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const overrides = body?.overrides ?? {};
    const plan = await readPlan();
    const results = runSimulation(plan, overrides);
    const saved = await writePlan({ ...plan, simulationResults: results });
    return NextResponse.json(saved.simulationResults);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error running simulation';
    console.error('[POST /api/simulate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### Pattern 3: /simulation Page with Skeleton + What-If Panel

**What:** Client component that fires `POST /api/simulate` on mount, shows skeleton while waiting, renders results + what-if panel when done.
**When to use:** Decision D-06/D-07 from CONTEXT.md.

```typescript
// src/app/simulation/page.tsx (sketch)
'use client';
export default function SimulationPage() {
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [overrides, setOverrides] = useState<SimulationOverrides>({});

  const runSim = useCallback(async (o: SimulationOverrides) => {
    setResults(null);                          // show skeleton
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: o }),
    });
    setResults(await res.json());
  }, []);

  useEffect(() => { runSim(overrides); }, []);  // auto-run on mount (D-06)

  if (!results) return <SimulationSkeleton />;
  return (
    <>
      {/* Phase 4 will add headline score, goal breakdown, recommendations */}
      <WhatIfPanel overrides={overrides} onChange={(o) => { setOverrides(o); runSim(o); }} />
    </>
  );
}
```

### Pattern 4: Wizard Completion Navigation Change

**What:** `handleFinish` in `src/app/interview/page.tsx` currently navigates to `/`. Must change to `/simulation`.
**Why:** Decision D-06 requires auto-navigate to `/simulation` on wizard completion.

```typescript
// Before (current):
const handleFinish = async () => {
  await updatePlan({ metadata: { wizardStep: 5 } });
  router.push('/');
};

// After:
const handleFinish = async () => {
  await updatePlan({ metadata: { wizardStep: 5 } });
  router.push('/simulation');
};
```

### Anti-Patterns to Avoid

- **Running simulation in the browser:** Decided server-side (D-01). Do not attempt client-side Web Workers.
- **Storing mean/stdDev only in SimulationResults:** The `SimulationResults.assumptions` field uses `realReturnMean` / `realReturnStdDev` naming but the decisions use nominal returns. Use nominal values in `assumptions` and note this in comments to avoid confusion.
- **Re-reading plan from disk inside the simulation function:** Keep `runSimulation` pure — no file I/O. Only the route reads/writes disk.
- **Exposing detailed stack traces in API errors:** Catch all errors in route handler and return sanitized messages only (matches CLAUDE.md security directive).

---

## Critical Design Issue: The Age Gap

**Status:** CONFIRMED BLOCKER — must be resolved in Wave 0.

The simulation requires "years until goal" for every goal type. This requires knowing the client's **current age**. The current `FinancialPlan` data model in `src/lib/types.ts` has **no `currentAge` or date-of-birth field**.

The existing types provide:
- `RetirementGoal.targetRetirementAge` — the target age at retirement
- `PurchaseGoal.targetYear` / `EducationGoal.targetYear` — absolute calendar years
- `LegacyGoal` — no date at all

Without `currentAge`, the engine cannot derive:
- Years until retirement = `targetRetirementAge - currentAge`
- Years until a `targetYear` goal = `targetYear - currentCalendarYear`

The `targetYear` goals (purchase, education) can use `new Date().getFullYear()` to derive years remaining from an absolute year — this works without `currentAge`. However, the retirement goal and total projection horizon fundamentally need current age.

**Recommended resolution:** Add `currentAge: number` to the `FinancialPlan` type and capture it in the wizard (either as a new field in IncomeExpenses step or as a standalone field). This is a data model change that must be planned as **Wave 0** work before any simulation math can be written.

**Alternative (discouraged):** Hard-code an assumed current age (e.g., 40) as a fallback when `currentAge` is undefined. This produces wrong results and should not be the permanent solution.

**Concretely, `currentAge` must be added to:**
1. `src/lib/types.ts` — add to `FinancialPlan` (or as a new `PersonalInfo` sub-type)
2. `src/lib/planDefaults.ts` — add default value (e.g., `0` or `null`)
3. Wizard IncomeExpenses step — add UI field to capture it
4. `src/lib/wizardSchemas.ts` — add Zod validation rule

---

## Monte Carlo Math: Per-Goal Projection

### Return Assumptions (Claude's Discretion — D-05)

Based on Fidelity historical data (1926–2022) and Bogleheads/academic sources for standard deviation:

| Risk Level | Nominal Mean | Nominal StdDev | Basis |
|------------|-------------|----------------|-------|
| conservative | 5.5% (0.055) | 8.0% (0.08) | ~30/70 stock/bond; Fidelity conservative avg ~5.75%, rounded; SD from Bogleheads 10yr data for low-equity portfolios |
| moderate | 7.0% (0.07) | 12.0% (0.12) | 60/40 stock/bond; Fidelity balanced avg ~7.74%; historical 60/40 SD ~10–12%; uses 12% as slightly conservative |
| aggressive | 9.0% (0.09) | 16.0% (0.16) | 80/20 stock/bond; Fidelity aggressive avg ~9.45%; 80/20 historical SD ~13–15%, uses 16% as conservative |

Inflation: 3.0% (0.03) — locked by D-04. Nominal returns already include inflation in these figures; no adjustment needed during projection. Inflation IS needed when projecting the **cost** of goals specified "in today's dollars" (e.g., `RetirementGoal.desiredAnnualIncome`).

**Confidence: MEDIUM** — Values derived from published Fidelity/Bogleheads data. Standard deviations are estimated from multiple corroborating sources (Bogleheads forum, CFA Institute research) but not from a single authoritative table.

### Normal Variate Generation: Box-Muller Transform

```typescript
// Generates a standard normal random variable using Box-Muller transform
// No external library needed. Well-established algorithm.
function randNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * z0;
}
```

**Note:** `u1` must not be 0 to avoid `log(0)`. In practice `Math.random()` extremely rarely returns exactly 0; adding `Math.max(Number.EPSILON, Math.random())` is a defensive guard worth including.

### Goal Projection Logic by Type

#### Retirement Goal

```
yearsToRetirement = targetRetirementAge - currentAge
planHorizon = yearsToRetirement + yearsInRetirement

Accumulation phase (years 0..yearsToRetirement-1):
  each year: portfolio = portfolio * (1 + r_t) + annualSavings
  where r_t ~ N(mean, stdDev) [one draw per year per iteration]
  annualSavings = (income.salary + income.otherAnnualIncome) * annualSavingsRate

Decumulation phase (years yearsToRetirement..planHorizon-1):
  each year: portfolio = portfolio * (1 + r_t) - annualWithdrawal
  annualWithdrawal = desiredAnnualIncome * (1.03)^yearsToRetirement  // inflate to future $
  (D-04: 3% inflation applied to the goal amount over the accumulation period)

Success condition: portfolio >= 0 at end of planHorizon
Funding gap (nominal): max(0, annualWithdrawal * yearsInRetirement - portfolioAtRetirement)
Funding gap (today's dollars): fundingGapNominal / (1.03)^yearsToRetirement
```

#### Purchase Goal and Education Goal

```
yearsToGoal = targetYear - currentCalendarYear  // uses new Date().getFullYear()
if yearsToGoal <= 0: treat as already due — check if current portfolio >= targetAmount

Accumulation (years 0..yearsToGoal-1):
  each year: portfolio = portfolio * (1 + r_t) + annualSavings

At year yearsToGoal: deduct targetAmount from portfolio
  (targetAmount is already in nominal dollars as entered by user)

Success condition: portfolio >= targetAmount at targetYear
  i.e., the portfolio can absorb the withdrawal without going negative
Funding gap (today's $): max(0, targetAmount - portfolioAtTargetYear)
```

**Note on shared portfolio:** All goals draw from the same simulated portfolio. Process goals in chronological order by target year. After each goal's withdrawal, the remaining portfolio continues to compound.

#### Legacy Goal

```
Legacy has no targetYear (only targetAmount). Treat as an end-of-plan balance target.
planHorizon = longest horizon across all other goals (or yearsToRetirement + yearsInRetirement if retirement goal exists, else default to 30 years)

Success condition: portfolio >= targetAmount at end of planHorizon
Funding gap (today's $): max(0, targetAmount - portfolioAtEndOfPlan)
  deflated to today's dollars: divide by (1.03)^planHorizon
```

**Confidence: MEDIUM** — This math follows the standard financial planning textbook approach. The multi-goal shared-portfolio deduction ordering is Claude's discretion per CONTEXT.md. The inflation adjustment logic for today's-dollar gap is standard practice.

### Overall Probability Score Derivation (SIM-03)

The `SimulationResults.overallProbability` must be derived from per-goal scores. Two reasonable approaches:

| Approach | Formula | Semantics |
|----------|---------|-----------|
| **Minimum** | `min(goalResults.map(g => g.probabilityScore))` | "Chance all goals are met" if goals are independent |
| **Iteration-level AND** | `successCount / ITERATIONS` where success = all goals succeed in that iteration | True joint probability — accounts for correlation (same market drives all goals) |
| **Weighted average** | `sum(weight_i * prob_i) / sum(weight_i)` | Softer overall score; weights by goal amount |

**Recommendation:** Use **iteration-level AND** — track a per-iteration `allGoalsMet` boolean and count those. This is the statistically correct approach since the same simulated market path drives all goals in a given iteration. It also naturally produces a score that is never higher than the lowest per-goal score.

```typescript
// Per-iteration tracking
let allMetCount = 0;
const perGoalSuccessCount = new Array(goals.length).fill(0);

for (let i = 0; i < ITERATIONS; i++) {
  const { goalsMet, allMet } = simulateOnePath(plan, assumptions);
  goalsMet.forEach((met, idx) => { if (met) perGoalSuccessCount[idx]++; });
  if (allMet) allMetCount++;
}

overallProbability = allMetCount / ITERATIONS;
```

**Confidence: HIGH** — Iteration-level joint success is the standard used by commercial tools (Boldin, T. Rowe Price, emoney Advisor).

---

## What-If Parameter Wiring (SIM-04)

The what-if panel sends a `POST /api/simulate` body with an `overrides` object:

```typescript
// Request body shape for POST /api/simulate
interface SimulateRequestBody {
  overrides?: SimulationOverrides;
}

interface SimulationOverrides {
  annualSavingsRate?: number;    // replaces plan.income.annualSavingsRate
  retirementAge?: number;        // replaces RetirementGoal.targetRetirementAge for all retirement goals
  returnMean?: number;           // replaces the risk-level default mean (e.g., 0.09)
  returnStdDev?: number;         // replaces the risk-level default stdDev
}
```

The API route passes `overrides` to `runSimulation(plan, overrides)`. The simulation function merges: overrides take precedence over plan-derived values, which take precedence over risk-level defaults. The original `plan` on disk is never modified by overrides — they are transient parameters for display only.

**Important:** What-if results are NOT persisted to `plan.json`. Only the initial auto-run result (no overrides) is written back to disk. This prevents what-if experimentation from clobbering the canonical simulation results.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Normal distribution sampling | Custom statistical library | Box-Muller with `Math.random()` (4 lines) | Standard algorithm; no dependency needed for simple normal sampling |
| Portfolio projection | 3rd-party Monte Carlo library | Plain TypeScript loop | Libraries add API surface with no benefit at this scale and complexity |
| Inflation-adjusted present value | Complex PV formula | Simple compound deflation: `futureValue / (1 + inflationRate)^years` | Sufficient precision for planning purposes |

**Key insight:** Financial planning Monte Carlo at this scale (10k iterations, 4 goal types) needs nothing beyond a loop and `Math.random()`. Libraries like `monte-carlo-simulation-js` or Python-style SciPy ports are overkill and introduce maintenance surface.

---

## Common Pitfalls

### Pitfall 1: Age Gap — Missing `currentAge` Field

**What goes wrong:** Simulation cannot compute "years until goal" for retirement goals or the total projection horizon. Without this, years-to-retirement defaults to 0 or a hardcoded constant, producing wildly incorrect probabilities.
**Why it happens:** The `FinancialPlan` type as designed captures everything *about* finances but not the person's age. Retirement age is captured as a goal parameter, but current age was not in the interview.
**How to avoid:** Wave 0 of the plan MUST add `currentAge` to the data model and capture it in the wizard before writing any simulation math.
**Warning signs:** If you try to write the retirement projection and find no way to derive `yearsToRetirement` from existing plan data, this is the gap.

### Pitfall 2: `log(0)` in Box-Muller

**What goes wrong:** `Math.random()` can return `0` (extremely rarely), causing `Math.log(0)` to return `-Infinity`, which then propagates as `NaN` through the portfolio calculation, silently corrupting results.
**Why it happens:** Naive Box-Muller uses `Math.random()` directly.
**How to avoid:** Use `Math.max(Number.EPSILON, Math.random())` for the `u1` argument.
**Warning signs:** `probabilityScore` returns `NaN` or `0` for some runs.

### Pitfall 3: Nominal vs. Real Return Confusion

**What goes wrong:** Goal amounts entered "in today's dollars" (e.g., `desiredAnnualIncome: 80000`) are compared against a nominally-projected portfolio without inflating the goal amount. This makes goals look easier to fund than they are.
**Why it happens:** D-05 specifies nominal return assumptions; D-04 specifies 3% inflation separately. If the engineer projects the portfolio with nominal returns but forgets to inflate goal costs, the two are inconsistent.
**How to avoid:** When evaluating whether a goal is met, inflate the goal amount to its future-dollar equivalent: `goalInFutureDollars = goalTodayDollars * (1.03)^yearsToGoal`. The `fundingGap` in `GoalResult` should then be expressed back in today's dollars (deflate the gap).
**Warning signs:** Simulation reports >90% success for modest savings rates — goals are being compared in today's dollars against a nominally-grown portfolio.

### Pitfall 4: What-If Overrides Accidentally Persisting

**What goes wrong:** A what-if adjustment (e.g., retirement age bumped to 67) gets saved to `plan.json`, overwriting the plan's actual retirement age.
**Why it happens:** If the route naively calls `writePlan` after every `POST /api/simulate` including what-if calls, what-if values replace plan data.
**How to avoid:** Only persist `simulationResults` on the initial auto-run call. What-if calls return results but never call `writePlan`. Distinguish via a request flag (`isWhatIf: true`) or simply never persist from the what-if path.
**Warning signs:** After using the what-if panel, the interview review page shows modified retirement age.

### Pitfall 5: Goals Not Processed in Chronological Order

**What goes wrong:** If a purchase goal in 2030 and a retirement goal in 2045 are processed retirement-first, the portfolio used for the purchase calculation is the post-retirement-decumulation balance rather than the pre-retirement balance. Goal outcomes depend on ordering.
**Why it happens:** `plan.goals` array has no guaranteed ordering.
**How to avoid:** Sort goals by `targetYear` (or `targetRetirementAge` converted to a year) ascending before simulation. Process each goal in chronological order, deducting withdrawals from the shared portfolio.
**Warning signs:** Simulation results change significantly when goals are reordered in the UI.

### Pitfall 6: Negative Portfolio Continuing to Compound

**What goes wrong:** Once portfolio goes negative in decumulation, it continues compounding (growing more negative), producing misleadingly large funding gaps.
**Why it happens:** Unchecked loop continues after portfolio < 0.
**How to avoid:** Once portfolio hits 0, clamp to 0 and stop adding returns — the iteration has already failed. Or: stop the iteration loop as soon as portfolio < 0 and record as failure.
**Warning signs:** `fundingGap` values are astronomically large for low-savings scenarios.

---

## Code Examples

### Box-Muller Normal Variate (verified pattern)

```typescript
// Standard Box-Muller transform — no external library needed
function randNormal(mean: number, stdDev: number): number {
  const u1 = Math.max(Number.EPSILON, Math.random()); // guard against log(0)
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * z;
}
```

### Single-Path Portfolio Projection (sketch)

```typescript
function simulateOnePath(
  initialPortfolio: number,
  annualSavings: number,
  years: number,
  mean: number,
  stdDev: number
): number[] {
  const portfolioByYear: number[] = [initialPortfolio];
  let p = initialPortfolio;
  for (let y = 0; y < years; y++) {
    const r = randNormal(mean, stdDev);
    p = Math.max(0, p * (1 + r) + annualSavings);
    portfolioByYear.push(p);
  }
  return portfolioByYear;
}
```

### Return Assumptions Map

```typescript
// src/lib/simulation.ts
const RETURN_ASSUMPTIONS: Record<RiskToleranceLevel, { mean: number; stdDev: number }> = {
  conservative: { mean: 0.055, stdDev: 0.08 },
  moderate:     { mean: 0.07,  stdDev: 0.12 },
  aggressive:   { mean: 0.09,  stdDev: 0.16 },
};

const INFLATION_RATE = 0.03;
const ITERATION_COUNT = 10_000;
```

### POST /api/simulate Route (mirrors existing /api/plan pattern)

```typescript
// src/app/api/simulate/route.ts
import { NextResponse } from 'next/server';
import { readPlan, writePlan } from '@/lib/persistence';
import { runSimulation, type SimulationOverrides } from '@/lib/simulation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const overrides: SimulationOverrides = body?.overrides ?? {};
    const isWhatIf: boolean = body?.isWhatIf ?? false;

    const plan = await readPlan();
    const results = runSimulation(plan, overrides);

    if (!isWhatIf) {
      // Only persist on the canonical run (wizard completion)
      await writePlan({ ...plan, simulationResults: results });
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[POST /api/simulate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Historical return sampling (uses actual historical sequences) | Parameterized log-normal distribution (N(mean, stdDev) per year) | Long-standing academic split | Historical sampling has path-dependency advantages but requires a return database; parametric is simpler and sufficient for a prototype |
| 1,000 iterations (common in older tools) | 10,000 iterations (D-02) | ~2010s as compute became cheap | Better convergence; probability scores stable to ±1% |
| Single overall probability score | Per-goal + overall score (SIM-02/SIM-03) | Modern practice | More actionable for client — they see which goal is the weakest link |

**Deprecated/outdated:**
- **Deterministic projection (single-path):** Produces a single portfolio value with no probability information. Replaced by Monte Carlo in all modern planning tools.

---

## Open Questions

1. **`currentAge` field — where in the wizard does the user enter it?**
   - What we know: It must be added to the data model and wizard. The IncomeExpenses step is the natural location (it already captures salary and savings rate).
   - What's unclear: Whether to add `currentAge` to the existing `Income` type or create a new `PersonalInfo` section in `FinancialPlan`.
   - Recommendation: Add `currentAge: number` directly to `FinancialPlan` as a top-level field (alongside `income`, `expenses`, etc.) to keep the type flat and avoid a breaking structural change to existing data. Add to `planDefaults` as `currentAge: 0`. Add a field to the IncomeExpenses wizard step.

2. **Funding gap calculation: nominal shortfall or PV shortfall?**
   - What we know: `GoalResult.fundingGap` is typed as "positive = shortfall in today's dollars". The today's-dollars framing is specified in the type definition.
   - What's unclear: Exactly which discount rate to use for "today's dollars" — the inflation rate, or the portfolio return rate?
   - Recommendation: Use inflation rate (3%) only. Discounting at the investment return rate would imply a different economic question (NPV vs. real purchasing power). Users intuitively understand "today's dollars" = inflation-adjusted.

3. **What-if `retirementAge` override when no retirement goal exists?**
   - What we know: The what-if panel has a retirement age lever (D-09). A plan may have no `RetirementGoal`.
   - What's unclear: Whether to hide the retirement age lever when no retirement goal exists, or silently ignore it.
   - Recommendation: Hide the retirement age lever in `WhatIfPanel` when `plan.goals.filter(g => g.type === 'retirement').length === 0`. This is a Phase 3 UI concern that the planner should include as a task.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `POST /api/simulate` server execution | Yes | LTS (inferred from Next.js 16) | — |
| Next.js dev server | Local testing of new route + page | Yes | 16.2.1 | — |
| Vitest | Unit tests for simulation engine | Yes | ^4.1.2 | — |

No external services, databases, or CLI tools are required beyond the existing project stack. All dependencies already installed.

---

## Performance Verification

Benchmark run in Node.js on the development machine:

```
10,000 iterations x 40-year projection = 400,000 year-steps
Time: 44ms
```

This is ~113x faster than the <5s requirement. Even with 4 goals and multi-path logic, total simulation time will remain well under 500ms, leaving substantial headroom. No performance optimization work is needed.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/types.ts` — `SimulationResults`, `GoalResult`, `FinancialPlan` type definitions; confirmed all output fields
- `src/app/api/plan/route.ts` — API route pattern to replicate for `/api/simulate`
- `.planning/phases/03-simulation-engine/03-CONTEXT.md` — All locked decisions (D-01 through D-10)
- Node.js benchmark (live measurement) — 44ms for 10k x 40yr confirms <5s performance is trivially achievable

### Secondary (MEDIUM confidence)
- [Fidelity Investment Strategy (via SmartAsset)](https://smartasset.com/retirement/conservative-rate-of-return-in-retirement) — Historical portfolio returns by allocation type (1926–2022): conservative 5.75%, balanced 7.74%, growth 8.75%, aggressive 9.45%
- [Bogleheads forum / Financial Samurai](https://www.bogleheads.org/forum/viewtopic.php?t=200109) — Standard deviation estimates for 60/40 (~10–12%), 80/20 (~13–16%) portfolios
- [Boldin Monte Carlo documentation](https://help.boldin.com/en/articles/5805671-boldin-s-monte-carlo-simulation) — Iteration-level success counting as industry-standard approach for overall probability
- Box-Muller transform — Standard algorithm, Wikipedia/academic; no single URL needed

### Tertiary (LOW confidence)
- Standard deviation for conservative portfolio (8%) — interpolated from multiple sources; no single definitive table found for low-equity portfolios. Flag for validation if precision matters.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new dependencies
- Architecture: HIGH — mirrors existing patterns exactly
- Monte Carlo math: MEDIUM — standard algorithms, return assumption values estimated from published sources
- Return assumptions: MEDIUM — mean values from Fidelity data; standard deviations from academic/community sources, not a single authoritative table
- Pitfalls: HIGH — all pitfalls verified against the actual codebase (types.ts, existing API pattern)

**Research date:** 2026-03-28
**Valid until:** 2026-06-28 (stable domain; only relevant change would be Next.js major version)
