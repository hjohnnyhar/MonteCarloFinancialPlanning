# Roadmap: Monte Carlo Financial Planning

## Overview

A single-user prototype that delivers the core simulation loop: a guided interview captures financial data, a Monte Carlo engine produces probability scores, and a results view presents the plan with recommendations and a downloadable PDF. The four phases build the stack from the ground up — foundation first, then interview, then simulation, then output — so each phase is independently verifiable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffold, data model, and JSON persistence layer (completed 2026-03-28)
- [ ] **Phase 2: Interview Wizard** - Guided multi-step wizard capturing all financial data
- [x] **Phase 3: Simulation Engine** - Monte Carlo simulation producing per-goal and overall probability scores (completed 2026-03-29)
- [ ] **Phase 4: Results & Reporting** - Plan output, recommendations, and PDF download

## Phase Details

### Phase 1: Foundation
**Goal**: The application runs locally with a working data persistence layer that saves and loads a financial plan from disk
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Running the app locally starts a working development server without errors
  2. A plan created in the app is written to a JSON file on disk
  3. Stopping and restarting the app loads the previously saved plan automatically
  4. All changes made to the plan (edits, re-runs) are persisted back to the JSON file without manual action
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Next.js scaffold, TypeScript types, and app shell layout
- [x] 01-02-PLAN.md — JSON persistence layer (readPlan/writePlan), API routes, and usePlan auto-save hook

**UI hint**: yes

### Phase 2: Interview Wizard
**Goal**: A user can complete the full financial interview from start to finish, capturing all data categories, with the ability to save progress and return later
**Depends on**: Phase 1
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, INT-08
**Success Criteria** (what must be TRUE):
  1. User can start a new plan and is presented with a multi-step wizard covering all data categories
  2. User can enter income & expenses, assets & liabilities, financial goals (retirement, purchases, education, legacy) with target dates, and risk tolerance
  3. User can close the app mid-interview, reopen it, and resume from where they left off
  4. User can navigate back to any completed wizard section, edit values, and save the changes
  5. User (acting as advisor) can pre-populate fields before handing the interview to a client
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Install dependencies, add wizardStep to data model, create schemas/config, wire Sidebar and dashboard
- [x] 02-02-PLAN.md — Wizard shell, InterviewPage, Income & Expenses step, Assets & Liabilities step
- [x] 02-03-PLAN.md — Financial Goals step with tabbed UI and 4 goal-type forms
- [x] 02-04-PLAN.md — Risk Tolerance questionnaire, Review & Confirm step, end-to-end verification

**UI hint**: yes

### Phase 3: Simulation Engine
**Goal**: The completed financial profile is run through a Monte Carlo simulation that produces a probability score per goal and an overall plan probability score, with support for what-if scenario adjustments
**Depends on**: Phase 2
**Requirements**: SIM-01, SIM-02, SIM-03, SIM-04
**Success Criteria** (what must be TRUE):
  1. After the interview completes, the simulation runs automatically and finishes in under 5 seconds
  2. Each financial goal displays its own probability score (e.g., "78% chance of funding retirement")
  3. An overall plan probability score is displayed, derived from all goals
  4. User can adjust key assumptions (savings rate, retirement age, spending) and re-run to see updated scores immediately
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Add currentAge to data model, build pure Monte Carlo simulation engine with TDD
- [x] 03-02-PLAN.md — POST /api/simulate route, /simulation page with skeleton and what-if panel, wizard navigation wiring

### Phase 4: Results & Reporting
**Goal**: The user sees a clear, complete view of their plan with headline score, goal breakdown, actionable recommendations, and a downloadable PDF report
**Depends on**: Phase 3
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04
**Success Criteria** (what must be TRUE):
  1. After simulation completes, the user sees a headline probability-of-success score as the primary output
  2. User can view a goal-by-goal breakdown showing each goal's probability and funding gap amount
  3. User sees at least one actionable recommendation explaining how to improve the plan score
  4. User can click a download button and receive a PDF containing the full plan: headline score, goal breakdown, and recommendations
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-28 |
| 2. Interview Wizard | 2/4 | In Progress|  |
| 3. Simulation Engine | 2/2 | Complete   | 2026-03-29 |
| 4. Results & Reporting | 0/? | Not started | - |
