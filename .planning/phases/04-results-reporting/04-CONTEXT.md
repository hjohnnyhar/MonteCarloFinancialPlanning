# Phase 4: Results & Reporting - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the `/simulation` page into a full plan output view: polished headline score with color-coded context, actionable rule-based recommendations with specific dollar amounts, a collapsible year-by-year projection table, and a downloadable PDF report.

Requirements in scope: RSLT-01, RSLT-02, RSLT-03, RSLT-04

**Scope expanded during discussion:** Year-by-year projection (median simulation path) is folded into Phase 4 — it appears as a collapsible section on `/simulation` and in the PDF. The simulation engine must be extended to output per-year median-path data.

</domain>

<decisions>
## Implementation Decisions

### Page Structure
- **D-01:** Enhance the existing `/simulation` page — do not create a new `/results` page. Recommendations, PDF download, and year-by-year projection are all added to `/simulation`.
- **D-02:** What-If panel stays alongside results unchanged (Phase 3 established this pattern). No layout restructuring.

### Headline Score Visual
- **D-03:** Polished number + context text treatment — keep the large percentage number but add: (1) color coding by score tier, (2) a short label ("Strong plan", "On track", "At risk"), (3) a one-liner explanation sentence.
- **D-04:** Score thresholds and label text — Claude's discretion. Use financially meaningful defaults (e.g., ≥80% = green/"Strong plan", 60–79% = amber/"On track", <60% = red/"At risk").

### Recommendations Engine
- **D-05:** Computed rule-based recommendations — server-side logic computes specific amounts (e.g., "Increase savings by $450/month to reach 90%"). Not generic score-range messages.
- **D-06:** Four levers evaluated by the recommendation engine:
  1. Savings rate increase — universally applicable
  2. Retirement age delay — only if plan has a retirement goal
  3. Monthly spending reduction — targets discretionary expenses
  4. Goal target reduction — adjusts an underfunded specific goal
- **D-07:** Top 3 recommendations always shown, regardless of score. Even strong plans see "here's how to reach 95%".
- **D-08:** Recommendations are included in the `/api/simulate` response — extend `SimulationResults` to include a `recommendations[]` array. One API call returns everything; no separate endpoint.

### Year-by-Year Projection
- **D-09:** Year-by-year median simulation path is folded into Phase 4 scope.
- **D-10:** Per-year data points: portfolio value (total assets), goal milestone markers (rows where a goal is due), annual savings contribution, annual withdrawal/spend.
- **D-11:** On screen: collapsible section on `/simulation` page ("View year-by-year projection"), hidden by default, expanded on demand.
- **D-12:** Simulation engine extended to output median-path data per year as a new field on `SimulationResults` (e.g., `yearlyProjection: YearlySnapshot[]`).

### PDF Report
- **D-13:** Client-side PDF generation using `@react-pdf/renderer`. No server-side puppeteer/Playwright. PDF generated in the browser on button click.
- **D-14:** PDF contents:
  - Headline score + context label
  - Goal-by-goal breakdown (probability + funding gap)
  - All 3 recommendations with specific amounts
  - Plan summary (key inputs: age, income, savings rate, total assets)
  - Year-by-year projection table (portfolio value, milestones, contributions, withdrawals)

### Claude's Discretion
- Exact score thresholds for color/label tiers (use financial planning conventions)
- Recommendation computation logic (how to determine the specific dollar amount that moves score to 90%)
- Median-path extraction from the 10,000 simulation runs (use the run closest to the median outcome, or compute year-by-year median across all runs)
- PDF layout, typography, and page breaks (follow the established visual system: Inter font, no component library)
- Download button placement and PDF filename (e.g., `financial-plan-report.pdf`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model & Simulation
- `src/lib/types.ts` — `SimulationResults`, `GoalResult`, `FinancialPlan` types. Phase 4 extends `SimulationResults` with `recommendations[]` and `yearlyProjection[]`. Must not break existing fields.
- `src/lib/simulation.ts` — Monte Carlo engine. Phase 4 extends this to compute recommendations and extract median-path year-by-year data.

### Existing Simulation Page (starting point)
- `src/app/simulation/page.tsx` — Current implementation: fetches plan + runs simulation, shows headline %, goal breakdown, what-if panel. Phase 4 enhances this file in-place.
- `src/components/simulation/WhatIfPanel.tsx` — What-If panel component. Unchanged by Phase 4.
- `src/components/simulation/SimulationSkeleton.tsx` — Loading skeleton. May need updating if new sections load.

### Existing API Route
- `src/app/api/simulate/` — POST /api/simulate route. Phase 4 extends its response shape to include recommendations and yearly projection.

### UI Conventions (must follow)
- `.planning/phases/02-interview-wizard/02-UI-SPEC.md` — Visual contract: spacing scale, typography (400/600 weights only), color tokens (white/gray-50/blue-600/red-700). All new UI in Phase 4 must follow this spec.

### Requirements
- `.planning/REQUIREMENTS.md` §Results & Reporting — RSLT-01 through RSLT-04 are the Phase 4 acceptance criteria.
- `.planning/ROADMAP.md` — Phase 4 success criteria (the acceptance test).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SimulationResults` type in `types.ts` — extend (not replace) with `recommendations` and `yearlyProjection` fields
- `formatCurrency()` helper in `simulation/page.tsx` — reuse for recommendation amounts and PDF
- `formatGoalType()` helper in `simulation/page.tsx` — reuse for goal labels in recommendations and PDF
- Color-coding pattern already in `page.tsx` (green ≥0.8, amber ≥0.5, red <0.5) — extend for headline tier logic

### Established Patterns
- No component library — raw `<div>`, `<p>`, `<button>` with Tailwind v4 utility classes
- Two font weights only: `font-normal` (400) and `font-semibold` (600)
- Card pattern: `rounded-lg border border-gray-200 bg-white p-6` used throughout `simulation/page.tsx`
- Section header pattern: `text-base font-semibold text-gray-900 mb-4`
- Auto-save via `usePlan()` hook — no separate save actions needed

### Integration Points
- `/api/simulate` response shape — adding `recommendations[]` and `yearlyProjection[]` to the returned JSON
- `simulation.ts` engine — adding recommendation computation and median-path extraction after the main MC loop
- `simulation/page.tsx` — adding 3 new sections: color-coded headline, recommendations list, collapsible year-by-year table, PDF download button

</code_context>

<specifics>
## Specific Ideas

- Year-by-year detail was explicitly requested — both as a collapsible on-screen section and inside the PDF. This is a meaningful scope addition beyond RSLT-01–04.
- Recommendations must compute specific amounts (e.g., dollar/month figures), not generic messages — the user explicitly chose the "computed rule-based" approach over score-range text.
- PDF uses `@react-pdf/renderer` specifically — lightweight, no server dependencies, appropriate for a single-user prototype.

</specifics>

<deferred>
## Deferred Ideas

None — all discussion items were folded into Phase 4 scope or resolved as decisions above.

</deferred>

---

*Phase: 04-results-reporting*
*Context gathered: 2026-03-28*
