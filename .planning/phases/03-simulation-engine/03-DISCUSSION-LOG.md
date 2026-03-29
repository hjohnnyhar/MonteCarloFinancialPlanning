# Phase 3: Simulation Engine - Discussion Log

**Date:** 2026-03-29
**For:** Human reference only — not consumed by downstream agents

---

## Areas Discussed

User selected all 4 gray areas: Where simulation runs, Asset allocation assumptions, What-if scope (SIM-04), Trigger behavior.

---

## Where Simulation Runs

**Q: Where should the Monte Carlo simulation execute?**
Options: Next.js API route / Client-side Web Worker / Inline in page
→ **Selected: Next.js API route** — consistent with /api/plan pattern

**Q: How many Monte Carlo iterations?**
Options: 10,000 / 1,000 / Configurable
→ **Selected: 10,000 runs**

---

## Asset Allocation Assumptions

**Q: How should risk levels map to return/volatility assumptions?**
Options: Standard 3-tier / Real returns / You decide
→ **Selected: You decide** — Claude to use reasonable industry defaults

**Q: Return distribution model?**
Options: Log-normal / normal distribution / Simple uniform variation
→ **Selected: Log-normal / normal distribution**

---

## What-If Scope (SIM-04)

**Q: Which parameters should the user be able to adjust? (multi-select)**
Options: Savings rate / Retirement age / Monthly spending / Market return assumptions
→ **Selected: Savings rate, Retirement age, Market return assumptions**

**Q: Where should the what-if panel live?**
Options: On simulation/results page / Back in wizard Review step
→ **Selected: On the simulation/results page**

---

## Trigger Behavior

**Q: When should simulation run?**
Options: Auto-run on wizard completion / Manual button on simulation page
→ **Selected: Auto-run on wizard completion**

**Q: Loading UX while computing?**
Options: Loading state on results page / Button loading state, then navigate
→ **Selected: Loading state on results page** — navigate to /simulation immediately, results load there
