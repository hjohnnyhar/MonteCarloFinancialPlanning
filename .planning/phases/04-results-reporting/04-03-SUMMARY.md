---
phase: "04"
plan: "03"
subsystem: results-reporting
tags: [pdf, react-pdf, download, report, client-side]
dependency_graph:
  requires: [04-02]
  provides: [RSLT-04]
  affects: [simulation-page]
tech_stack:
  added: ["@react-pdf/renderer@^4"]
  patterns: [lazy-import-ssr-safe, imperative-blob-download, client-side-pdf]
key_files:
  created:
    - src/components/pdf/FinancialPlanReport.tsx
    - src/components/simulation/DownloadPdfButton.tsx
  modified:
    - src/app/simulation/page.tsx
    - package.json
    - package-lock.json
decisions:
  - "D-15: @react-pdf/renderer lazy-imported inside click handler via Promise.all to avoid SSR bundling and keep initial page load fast"
  - "D-16: formatPdfCurrency() replaces Intl.NumberFormat in PDF component because react-pdf worker context may not have Intl available"
  - "D-17: Projection table placed on Page 2 (separate Page element) to give it full page width; react-pdf handles automatic page breaks via wrap prop on rows"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 5
requirements: [RSLT-04]
---

# Phase 04 Plan 03: PDF Report Generation Summary

## One-liner

Client-side PDF report via @react-pdf/renderer with lazy SSR-safe import, covering headline score, goal breakdown, recommendations, plan summary, and year-by-year projection table.

## What Was Built

### Task 1: @react-pdf/renderer installation and FinancialPlanReport component

Installed `@react-pdf/renderer`. Created `src/components/pdf/FinancialPlanReport.tsx` — a react-pdf `Document` component that accepts `{ plan: FinancialPlan, results: SimulationResults }` props and generates a two-page PDF:

- **Page 1:** Title + generation date header; headline probability score with tier color and label; plan summary (age, income, savings rate, total assets, risk tolerance); goal breakdown table (goal type, target amount, probability with color coding, funding gap); recommendations list with current/suggested values
- **Page 2:** Year-by-year projection table with all columns (year, age, portfolio value, savings, withdrawals, milestone); milestone rows highlighted in amber

All styles use `StyleSheet.create()` with Helvetica (built-in, no registration). Colors use hex equivalents of app Tailwind tokens. A custom `formatPdfCurrency()` avoids `Intl.NumberFormat` which may be unavailable in the react-pdf worker context (D-16).

### Task 2: DownloadPdfButton and simulation page integration

Created `src/components/simulation/DownloadPdfButton.tsx` — uses `Promise.all` to lazy-import both `@react-pdf/renderer` and `FinancialPlanReport` on first click (D-15). Calls `pdf(doc).toBlob()` for imperative blob generation, then triggers a DOM anchor click to download `financial-plan-report.pdf`. Shows "Generating..." during generation and an inline error message on failure.

Updated `src/app/simulation/page.tsx` to render `DownloadPdfButton` right-aligned in the header area next to the page title, visible only when both `results` and `plan` are loaded.

## Verification

- `npx vitest run` — 51 tests pass, zero regressions
- `npm run build` — compiled successfully, no TypeScript errors, no SSR warnings
- All routes static/dynamic as expected

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired from live `plan` and `results` props.

## Self-Check: PASSED

Files exist:
- src/components/pdf/FinancialPlanReport.tsx — FOUND
- src/components/simulation/DownloadPdfButton.tsx — FOUND

Commits exist:
- ac561cb — feat(04-03): add @react-pdf/renderer and FinancialPlanReport PDF component
- 3553a28 — feat(04-03): add DownloadPdfButton and wire to simulation page
