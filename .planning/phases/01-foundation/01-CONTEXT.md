# Phase 1: Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working Next.js application that runs locally with a full layout scaffold, a defined TypeScript data model for the financial plan, and a JSON persistence layer that saves and loads the plan automatically. No interview UI, no simulation, no results — just the structural foundation every other phase builds on.

Requirements in scope: DATA-01, DATA-02, DATA-03

</domain>

<decisions>
## Implementation Decisions

### Framework & Stack
- **D-01:** Next.js full-stack (single app). API routes serve as the Node.js backend. One repo, one dev server.
- **D-02:** App Router (not Pages Router) — current Next.js standard with Server Components, layouts, and route handlers.
- **D-03:** npm as the package manager.

### Data Model
- **D-04:** Define the full `FinancialPlan` JSON schema in Phase 1 — income/expenses, assets/liabilities, goals (retirement, purchases, education, legacy), risk tolerance, and a simulation results placeholder. Later phases fill fields in; they do not reshape the schema.
- **D-05:** Back the schema with TypeScript interfaces from day 1. Every phase gets type safety and IDE autocomplete. Define `FinancialPlan` and all sub-types (e.g., `Goal`, `Assets`, `SimulationResults`) in a shared `lib/types.ts` or similar.

### Persistence
- **D-06:** Auto-save on every change — any mutation to the plan triggers an immediate write to disk. No save button, no data loss risk.
- **D-07:** JSON file lives at `<project-root>/data/plan.json`. Predictable path, easy to git-ignore, easy to inspect.

### App Shell & Styling
- **D-08:** Deliver a full layout scaffold at the end of Phase 1: top nav, sidebar placeholder, page routing structure, and a minimal home/dashboard placeholder. Later phases slot UI into the established structure without rework.
- **D-09:** Tailwind CSS for styling. Utility-first, fast for prototyping, excellent Next.js integration.

### Claude's Discretion
- Exact TypeScript type structure (field names, nesting depth, nullable vs optional) — define sensibly for a financial plan domain
- Error handling for missing or malformed JSON file on startup (reasonable defaults: create empty plan if file not found, surface an error boundary if file is corrupt)
- Exact layout/nav structure within the scaffold — should be extensible but doesn't need to be final
- Linting/formatting defaults (ESLint + Prettier is standard)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements. DATA-01–03 are the Phase 1 requirements. Review INT, SIM, and RSLT sections to ensure the Phase 1 data model schema covers all fields those phases will need.

### Roadmap
- `.planning/ROADMAP.md` — Phase 1 success criteria and phase dependencies. Phase 1 goal and success criteria are the acceptance test for this phase.

### Project
- `.planning/PROJECT.md` — Core constraints: TypeScript full-stack, no auth, single JSON plan file, Monte Carlo simulation target <5s.

No external specs or ADRs — all requirements are captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is empty. Phase 1 creates all foundational assets.

### Established Patterns
- None yet — patterns established in this phase become the conventions for all subsequent phases.

### Integration Points
- `data/plan.json` — The single integration point for all phases. Phase 2 reads/writes interview data; Phase 3 reads plan data and writes simulation results; Phase 4 reads simulation results for display.
- Next.js API routes (e.g., `app/api/plan/route.ts`) — Backend layer for reading/writing the plan. Phases 2–4 add their own API routes following this pattern.

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the decisions above — open to standard Next.js/Tailwind approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-28*
