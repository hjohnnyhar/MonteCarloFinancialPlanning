---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [nextjs, typescript, tailwindcss, react, vitest, prettier]

# Dependency graph
requires: []
provides:
  - Next.js 16 App Router project with TypeScript strict mode and Tailwind CSS v4
  - FinancialPlan TypeScript interface hierarchy covering all data for Phases 2-4
  - createEmptyPlan() factory returning zero-value FinancialPlan
  - AppShell layout with TopNav, Sidebar, and main content slot
  - Dashboard placeholder page at /
  - Vitest test infrastructure with 7 passing tests
affects:
  - 01-02 (persistence layer reads/writes FinancialPlan type)
  - 02-interview (interview wizard fills FinancialPlan fields)
  - 03-simulation (simulation reads FinancialPlan, writes SimulationResults)
  - 04-results (results display reads SimulationResults from FinancialPlan)

# Tech tracking
tech-stack:
  added:
    - next@16.2.1
    - react@19.2.4
    - typescript@5 (strict mode)
    - tailwindcss@4
    - prettier@3 with prettier-plugin-tailwindcss
    - vitest@4 for unit testing
  patterns:
    - Next.js App Router with src/ directory layout
    - Tailwind utility classes throughout (no CSS modules)
    - Named exports for components (not default exports)
    - TDD for data model utilities

key-files:
  created:
    - src/lib/types.ts (FinancialPlan interface and all sub-types)
    - src/lib/planDefaults.ts (createEmptyPlan factory)
    - src/lib/__tests__/planDefaults.test.ts (Vitest tests)
    - src/components/AppShell.tsx (layout container)
    - src/components/TopNav.tsx (header navigation)
    - src/components/Sidebar.tsx (page navigation links)
    - src/app/layout.tsx (Next.js root layout using AppShell)
    - src/app/page.tsx (dashboard placeholder)
    - vitest.config.ts (test configuration)
    - .prettierrc (code formatting config)
  modified:
    - src/app/globals.css (stripped to Tailwind import only)
    - .gitignore (added data/ for sensitive plan.json)
    - package.json (added test scripts, vitest, prettier)

key-decisions:
  - "Named exports for all components (consistent pattern for tree-shaking)"
  - "Vitest over Jest — simpler config, faster, ESM-native, works without Next.js test transform setup"
  - "RiskTolerance.level is null (not undefined) to match simulationResults null pattern and JSON serialization"
  - "Stripped globals.css to single @import tailwindcss — no theme variables, no dark mode by default"
  - "Inter font via next/font/google in layout.tsx per Next.js best practice"

patterns-established:
  - "Component pattern: named exports in src/components/, imported with @/components/ alias"
  - "Types pattern: all interfaces in src/lib/types.ts, factory in src/lib/planDefaults.ts"
  - "Test pattern: Vitest in src/**/__tests__/*.test.ts"
  - "Null vs undefined: nullable fields use | null (not optional), ensures JSON round-trip safety"

requirements-completed: [DATA-01, DATA-02, DATA-03]

# Metrics
duration: 6min
completed: 2026-03-28
---

# Phase 1 Plan 01: Foundation Summary

**Next.js 16 app with complete FinancialPlan TypeScript schema, createEmptyPlan factory, and AppShell layout (TopNav + Sidebar + content slot) ready for Phase 2 interview UI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-28T23:01:28Z
- **Completed:** 2026-03-28T23:07:35Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Scaffolded Next.js 16 with App Router, TypeScript strict mode, Tailwind CSS v4, ESLint, Prettier
- Defined complete FinancialPlan type hierarchy (16 exported types/interfaces) covering all data fields for Phases 2-4
- Implemented createEmptyPlan() factory with 7 passing Vitest tests covering all behavior criteria
- Built AppShell layout with TopNav (brand link) and Sidebar (Dashboard/Interview/Simulation/Results nav links)
- `npm run build` and `npx tsc --noEmit` both exit 0; dev server starts ready in <1s

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project** - `dbb5666` (chore)
2. **Task 2: TDD RED - failing tests for createEmptyPlan** - `bfb0e02` (test)
3. **Task 2: TDD GREEN - FinancialPlan types and createEmptyPlan** - `1ad6851` (feat)
4. **Task 3: App shell with TopNav, Sidebar, AppShell, layout, page** - `8367ddb` (feat)
5. **Housekeeping: public assets and favicon** - `40ff819` (chore)

_Note: Task 2 was TDD — test commit then implementation commit_

## Files Created/Modified
- `src/lib/types.ts` - FinancialPlan interface and 15 sub-types (GoalType, RetirementGoal, PurchaseGoal, EducationGoal, LegacyGoal, Goal, Income, Expenses, Assets, Liabilities, RiskToleranceLevel, RiskTolerance, GoalResult, SimulationResults, PlanMetadata)
- `src/lib/planDefaults.ts` - createEmptyPlan() factory returning zero-value FinancialPlan with null simulationResults
- `src/lib/__tests__/planDefaults.test.ts` - 7 Vitest tests for createEmptyPlan behavior
- `src/components/AppShell.tsx` - Full-page layout: TopNav + Sidebar + main content slot
- `src/components/TopNav.tsx` - Header with "Monte Carlo Planner" brand link
- `src/components/Sidebar.tsx` - Left nav with Dashboard/Interview/Simulation/Results links
- `src/app/layout.tsx` - Root layout importing AppShell with Inter font and site metadata
- `src/app/page.tsx` - Dashboard placeholder with "Financial Plan Dashboard" heading
- `src/app/globals.css` - Stripped to `@import "tailwindcss"` only
- `.gitignore` - Added `data/` line for sensitive plan.json
- `.prettierrc` - singleQuote, semi, trailingComma es5, prettier-plugin-tailwindcss
- `vitest.config.ts` - Node environment, src/**/*.test.ts pattern
- `package.json` - Added test/test:watch scripts, vitest, prettier, prettier-plugin-tailwindcss

## Decisions Made
- Used Vitest over Jest — no Next.js-specific test transform config required, ESM-native, simpler setup
- Named exports for all components (vs default exports) — consistent pattern, better refactoring support
- `RiskTolerance.level` typed as `RiskToleranceLevel | null` (not optional) to ensure JSON round-trip preserves absence
- Stripped globals.css to bare Tailwind import — no dark mode variables to avoid complexity in Phase 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app blocked by existing .planning/ files**
- **Found during:** Task 1 (scaffold command)
- **Issue:** `create-next-app` refused to scaffold in a directory containing existing files (.planning/, CLAUDE.md)
- **Fix:** Scaffolded in /tmp/mcfp-scaffold, then rsync'd files (excluding .git, node_modules, conflicting docs) to the worktree
- **Files modified:** All scaffold files
- **Verification:** `npm run build` exits 0
- **Committed in:** dbb5666 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Workaround required due to worktree containing planning files — scaffold outcome identical to direct approach.

## Issues Encountered
- create-next-app 16.2.1 scaffolded Next.js 16 (not 15 as expected) — API is compatible, build passes cleanly
- globals.css in Next.js 16 uses `@import "tailwindcss"` instead of `@tailwind` directives — kept as-is since it's the correct format for Tailwind v4

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FinancialPlan type hierarchy is complete — Phase 2 interview wizard can immediately use all fields
- AppShell provides the layout slot — Phase 2 wizard pages will slot into the `<main>` area
- JSON persistence layer (DATA-01–03) is the next plan (01-02) in this phase

## Self-Check: PASSED

All created files confirmed present on disk. All task commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-28*
