# Requirements: Monte Carlo Financial Planning

**Defined:** 2026-03-28
**Core Value:** Complete the interview and immediately see a credible probability score backed by Monte Carlo simulation

## v1 Requirements

Single-user prototype. No authentication. One plan stored in a local JSON file.

### Interview

- [x] **INT-01**: User can start a new financial plan via a guided multi-step wizard
- [x] **INT-02**: Wizard captures income & expenses (salary, monthly spend, savings rate)
- [x] **INT-03**: Wizard captures assets & liabilities (accounts, investments, debts, net worth)
- [x] **INT-04**: Wizard captures financial goals: retirement income, large purchases, education funding, legacy/estate amounts and target dates
- [x] **INT-05**: Wizard captures risk tolerance via questionnaire (maps to asset allocation assumptions)
- [x] **INT-06**: User can save progress mid-interview and return to complete it later
- [x] **INT-07**: User can edit any interview section after initial completion and re-run simulation
- [x] **INT-08**: User (acting as advisor) can pre-populate known data fields before starting the interview

### Simulation

- [x] **SIM-01**: System runs Monte Carlo simulation with thousands of randomized market-return scenarios against the completed financial profile
- [x] **SIM-02**: Simulation produces a probability score per financial goal (e.g., "78% chance of funding retirement")
- [x] **SIM-03**: Simulation produces an overall plan probability score across all goals
- [x] **SIM-04**: User can adjust key assumptions (savings rate, retirement age, spending) and re-run simulation to see updated scores (what-if)

### Results & Reporting

- [x] **RSLT-01**: User sees headline plan probability score after simulation completes
- [x] **RSLT-02**: User sees goal-by-goal breakdown with individual probabilities and funding gap amounts
- [x] **RSLT-03**: System generates actionable recommendations to improve the plan score (e.g., "Increase savings by $X/month to reach 90%")
- [x] **RSLT-04**: User can download a PDF report of their full financial plan including scores, goal breakdown, and recommendations

### Data Persistence

- [x] **DATA-01**: Plan data is saved to a local JSON file on disk
- [x] **DATA-02**: Application loads existing plan from JSON file on startup if present
- [x] **DATA-03**: All changes (interview edits, re-runs) are persisted back to the JSON file

## v2 Requirements

Deferred to future release after prototype validates the core experience.

### Multi-User & Auth

- **AUTH-01**: Advisor account with ability to manage multiple clients
- **AUTH-02**: Client login tied to their specific plan
- **AUTH-03**: Role-based access: advisor sees all clients, client sees only their own plan
- **AUTH-04**: Email/password signup + login
- **AUTH-05**: Email verification on signup
- **AUTH-06**: Password reset via email link

### Enhanced Output

- **RSLT-05**: Fan chart / range-of-outcomes visualization (10th/50th/90th percentile)
- **RSLT-06**: Plan versioning — compare current plan to a previous snapshot

### Integrations

- **INTG-01**: Real-time account data sync (Plaid or similar)
- **INTG-02**: Export to financial planning file formats

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication | Prototype focuses on core simulation loop; auth adds complexity without validating the value |
| Database (SQLite, Postgres) | JSON file is sufficient for single-plan prototype |
| Multiple plans | Single plan validates the UX; multi-plan requires auth/user model |
| Mobile native app | Web-first; mobile later |
| Real-time bank feeds | Manual entry sufficient to validate simulation accuracy |
| Multi-advisor firm management | Single-user prototype; team features are v3+ |
| OAuth (Google/GitHub) | Not needed without multi-user auth |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INT-01 | Phase 2 | Complete |
| INT-02 | Phase 2 | Complete |
| INT-03 | Phase 2 | Complete |
| INT-04 | Phase 2 | Complete |
| INT-05 | Phase 2 | Complete |
| INT-06 | Phase 2 | Complete |
| INT-07 | Phase 2 | Complete |
| INT-08 | Phase 2 | Complete |
| SIM-01 | Phase 3 | Complete |
| SIM-02 | Phase 3 | Complete |
| SIM-03 | Phase 3 | Complete |
| SIM-04 | Phase 3 | Complete |
| RSLT-01 | Phase 4 | Complete |
| RSLT-02 | Phase 4 | Complete |
| RSLT-03 | Phase 4 | Complete |
| RSLT-04 | Phase 4 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
