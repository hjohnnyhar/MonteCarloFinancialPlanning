# Monte Carlo Financial Planning

## What This Is

A full-featured web application for financial planning that combines a structured client interview with Monte Carlo simulation to produce a probability-of-success score across all financial goals. Financial advisors invite clients to self-onboard, clients complete the interview, and both parties can view the plan, goal breakdown, recommendations, and a PDF report.

## Core Value

A client completes the interview and immediately sees a single, credible probability score — "You have an 87% chance of meeting all your financial goals" — backed by Monte Carlo simulation.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Interview & Data Capture**
- [ ] Advisor can create a client account and send a self-onboarding invite link
- [ ] Client completes a structured interview capturing: income & expenses, assets & liabilities, goals & timeline, and risk tolerance
- [ ] Interview saves progress so client can return and continue
- [ ] Client can define multiple financial goals: retirement income, large purchases, education funding, legacy/estate

**Monte Carlo Simulation**
- [ ] System runs Monte Carlo simulation against client's full financial profile
- [ ] Simulation models goal probability across a multi-decade timeline
- [ ] Each goal has its own probability score
- [ ] Overall plan probability score is derived from all goals

**Plan Output**
- [ ] Client sees a headline probability-of-success score after completing interview
- [ ] Plan shows goal-by-goal breakdown with individual probabilities and funding gaps
- [ ] System generates actionable recommendations based on plan gaps
- [ ] Client can download a PDF report of their full financial plan

**Advisor Dashboard**
- [ ] Advisor sees a client list with onboarding status, last-updated date, and plan score per client
- [ ] Advisor can click into any client to view their full plan
- [ ] Advisor can track which clients have completed onboarding vs pending

**Auth & Access**
- [ ] Advisor account with ability to manage multiple clients
- [ ] Client login tied to their specific plan
- [ ] Role-based access: advisor sees all clients, client sees only their own plan

### Out of Scope

- Mobile native app — web is sufficient for v1; mobile can come later
- Real-time account syncing (Plaid/bank feeds) — manual data entry for v1
- Full CRM features (notes, meeting history, versioned plans) — client list + status is enough for v1
- Multi-advisor firm management / team accounts — single advisor per account in v1
- Public/anonymous plan calculator — requires authenticated account

## Context

- **Domain:** Financial planning SaaS, advisor-client model
- **Simulation approach:** Monte Carlo (thousands of randomized return scenarios) to generate probability distributions across goals rather than deterministic projections
- **Interview UX:** Structured wizard — advisor sends invite, client self-onboards through guided steps covering income/expenses, assets/liabilities, goals/timeline, risk tolerance
- **Dual-role access:** Same web app serves both advisors (client management view) and clients (own plan view), differentiated by role after login

## Constraints

- **Tech Stack**: TypeScript full-stack — React or Next.js frontend, Node.js backend — user's explicit requirement
- **Data sensitivity**: Financial data is highly sensitive — auth, encryption at rest, and secure API design are non-negotiable
- **Simulation performance**: Monte Carlo with thousands of runs must complete fast enough for a responsive UX (target: <5s for results)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client self-onboarding via invite link | Scales advisor's time — they don't need to be present for data entry | — Pending |
| Single probability score as headline output | Simplest, most actionable result; avoids overwhelming users with charts | — Pending |
| JavaScript/TypeScript full-stack | User preference; strong ecosystem for both web UI and financial math | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after initialization*
