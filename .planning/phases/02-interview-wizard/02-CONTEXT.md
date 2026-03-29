# Phase 2: Interview Wizard - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the multi-step interview wizard at `/interview` that captures the complete financial profile — income & expenses, assets & liabilities, financial goals, and risk tolerance — with save/resume support and the ability to edit any section after completion.

Requirements in scope: INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, INT-08

</domain>

<decisions>
## Implementation Decisions

### Goals Management UX
- **D-01:** Goals step uses internal tabs (Retirement | Purchases | Education | Legacy) within a single wizard step. The wizard shows "Goals" as one step in the progress indicator; inside, four tabs let the user switch between goal types.
- **D-02:** All goal types are optional — zero goals of any type is valid. No minimum goal count required to proceed.
- **D-03:** Multiple goals per type are allowed (e.g., two purchase goals, two education goals for different children). Each tab shows a list of that type's goals with add/remove.

### Validation Strictness
- **D-04:** Warn but allow proceed — clicking Next on any step shows inline field-level warnings for empty/invalid required fields, but does NOT block the user from advancing. Users can move forward with incomplete data.
- **D-05:** Free back navigation — clicking any completed step label in the sidebar always works. No validation gate on backwards movement. Already-saved data is never lost (auto-save on every updatePlan call).
- **D-06:** All steps must pass validation before the user can reach the Review step. The "Review" step in the sidebar/navigation is only enabled once all prior steps have valid data.

### Risk Tolerance Questionnaire
- **D-07:** All 4–5 questions shown on one screen simultaneously. No sub-navigation within the risk tolerance step.
- **D-08:** Multiple choice (radio buttons) per question. Each question has 3–4 labeled answer options that map to a numeric score. The score from all answers aggregates to the 1–10 total.
- **D-09:** After the user answers all questions, show the derived risk level with a brief explanation: e.g., "Based on your answers: Moderate risk tolerance — balanced mix of stocks and bonds." This confirmation helps the user trust the mapping.

### Wizard Chrome & Step Navigation
- **D-10:** When on `/interview`, the existing `Sidebar.tsx` slot renders the wizard step list instead of its normal navigation links. The 224px sidebar width is preserved — no layout shift. Step labels match the wizard sections (Income & Expenses, Assets & Liabilities, Goals, Risk Tolerance, Review).
- **D-11:** Step labels remain after interview completion. Clicking any step label at any time (during or after the interview) jumps into the wizard at that step. This is the primary edit-mode UX (INT-07).
- **D-12:** Entry point: the dashboard/home page has a "Start Interview" button that routes to `/interview`. The wizard runs inside the existing AppShell (TopNav + Sidebar). No overlay or full-screen mode.

### Claude's Discretion
- Exact question text and scoring matrix for the risk tolerance questionnaire (4–5 questions, radio buttons, maps to 1–10 scale → conservative/moderate/aggressive threshold)
- Field-level required vs optional distinction within each step (e.g., which income fields are required to proceed)
- How `wizardStep` is persisted alongside the plan data (e.g., as a top-level field on `FinancialPlan` or in a separate local state)
- Visual treatment of "warned but allowed" state — e.g., amber border on incomplete fields vs no visual until user attempts Review
- Exact wording for step completion indicators in the sidebar (checkmark, filled dot, etc.)
- Pre-population UX for INT-08 — no separate advisor UI; fields are pre-filled from loaded `plan` data via `usePlan()` before the user sees them

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model
- `src/lib/types.ts` — Complete `FinancialPlan` schema. All interview fields are defined here (Income, Expenses, Assets, Liabilities, Goal union types, RiskTolerance). Do not redefine — map wizard inputs to these types exactly.

### Persistence Layer
- `src/hooks/usePlan.ts` — `usePlan()` hook: loads plan via GET /api/plan, exposes `updatePlan(patch)` for auto-saving partial updates. The wizard uses this for all reads and writes — no direct fetch calls in wizard components.

### Existing Shell Components
- `src/components/AppShell.tsx` — Root layout shell. Wizard page renders inside this.
- `src/components/Sidebar.tsx` — The 224px sidebar. Phase 2 replaces its content on `/interview` with the step list. Read this before implementing — understand how it currently renders nav links.
- `src/components/TopNav.tsx` — 56px top bar. Unchanged by Phase 2.

### UI Design Contract
- `.planning/phases/02-interview-wizard/02-UI-SPEC.md` — Visual contract: spacing scale, typography (2 weights only: 400/600), color tokens (white/gray-50/blue-600/red-700), component patterns for inputs and buttons. All wizard UI must follow this spec.

### Technical Research
- `.planning/phases/02-interview-wizard/02-RESEARCH.md` — Confirmed stack: react-hook-form v7 + zod v4 + @hookform/resolvers v5 for per-step validation. Single-page wizard at `/interview`. Step index persisted as `wizardStep` to plan JSON.

### Requirements
- `.planning/REQUIREMENTS.md` — INT-01 through INT-08 are the Phase 2 requirements. Every requirement must be verifiably met.

### Roadmap
- `.planning/ROADMAP.md` — Phase 2 success criteria. These are the acceptance test.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePlan()` hook — Complete plan state manager with auto-save. Wizard reads plan data for pre-population and calls `updatePlan(patch)` on every step's "Next" action.
- `AppShell.tsx` / `Sidebar.tsx` / `TopNav.tsx` — The shell is already built. Phase 2 adds a page inside it and conditionally replaces sidebar content on `/interview`.
- `src/lib/types.ts` — All data types for the wizard are already defined and exported. Wizard components receive typed props; no new types needed beyond possibly `wizardStep`.
- `src/lib/planDefaults.ts` — Default plan values used for initialization. Wizard fields will start from these defaults when no data has been entered yet.

### Established Patterns
- Auto-save pattern: every `updatePlan()` call fires PUT /api/plan with no user-triggered save. Wizard steps call `updatePlan()` on Next, not on blur/change.
- No component library: raw `<input>`, `<select>`, `<button>` elements styled with Tailwind v4 utility classes. No shadcn/ui.
- Two font weights only: `font-normal` (400) and `font-semibold` (600). No `font-medium`, `font-bold`, etc.

### Integration Points
- `/interview` — new Next.js App Router page. Renders inside the existing `layout.tsx` (which provides AppShell).
- Sidebar conditional rendering — needs to detect `/interview` route and switch from normal nav links to wizard step list.
- `data/plan.json` — Wizard writes to this via the API. `wizardStep` field needs to be added to persistence to support resume (INT-06).

</code_context>

<specifics>
## Specific Ideas

No specific external references — open to standard Next.js/Tailwind approaches within the constraints above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-interview-wizard*
*Context gathered: 2026-03-28*
