# Phase 2: Interview Wizard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 02-interview-wizard
**Areas discussed:** Goals management UX, Validation strictness, Risk tolerance questionnaire, Wizard chrome & step navigation

---

## Goals Management UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline list with type picker | Running list on page, type picker, fields appear inline, Add button | |
| Add-goal modal or drawer | Clicking Add opens a modal/panel with type-specific form | |
| One-type-at-a-time sub-steps | Each goal type is its own mini wizard sub-step | ✓ |

**User's choice:** One-type-at-a-time sub-steps

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — all goal types are optional | No minimum goal count required | ✓ |
| At minimum, retirement is required | Require at least one retirement goal | |
| You decide | Claude determines minimum | |

**User's choice:** All goal types are optional

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — multiple per type | Multiple goals per type (e.g., two purchase goals) | ✓ |
| One per type max | Single goal form per type | |

**User's choice:** Multiple per type

---

| Option | Description | Selected |
|--------|-------------|----------|
| Combined as one wizard step with internal tabs | "Goals" = one step with Retirement/Purchases/Education/Legacy tabs | ✓ |
| Each type is its own numbered wizard step | 4 separate steps in the wizard progress | |

**User's choice:** Combined as one wizard step with internal tabs

---

## Validation Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Block with inline errors | Block advancing until required fields are filled | |
| Warn but allow proceed | Show warnings, allow advancing anyway | ✓ |
| You decide | Claude picks the approach | |

**User's choice:** Warn but allow proceed

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — always free to go back | Free navigation to any completed step | ✓ |
| Back button only — no jump navigation | Only Back button moves backwards | |

**User's choice:** Always free to go back

---

| Option | Description | Selected |
|--------|-------------|----------|
| All steps must pass validation | Review step only enabled after all steps are valid | ✓ |
| No minimum — user can reach Review at any time | User can reach Review with empty fields | |

**User's choice:** All steps must pass validation before Review

**Notes:** Interesting combination — lenient within steps (warn but allow) but strict at the Review gate (all steps must be valid to proceed to Review).

---

## Risk Tolerance Questionnaire

| Option | Description | Selected |
|--------|-------------|----------|
| All questions on one screen | All 4–5 questions visible at once | ✓ |
| One question at a time | Each question on its own screen | |

**User's choice:** All questions on one screen

---

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple choice (radio buttons) | 3–4 labeled options per question | ✓ |
| 1–5 scale per question | Row of 5 buttons per question | |
| Single slider (1–10) | One slider replacing questionnaire | |

**User's choice:** Multiple choice (radio buttons)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show derived level with brief explanation | "Based on your answers: Moderate risk tolerance — balanced mix of stocks and bonds" | ✓ |
| Yes — show level only | Just display "Moderate" | |
| No — hidden from user | Score computed internally only | |

**User's choice:** Show derived level with brief explanation

---

## Wizard Chrome & Step Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Replace sidebar content with step list | Existing Sidebar.tsx slot shows wizard steps on /interview | ✓ |
| Horizontal stepper above the form | Step bar above form content, inside main area | |
| No persistent step list | Progress bar only | |

**User's choice:** Replace sidebar content with step list

---

| Option | Description | Selected |
|--------|-------------|----------|
| Click step label in sidebar (same nav as during wizard) | Step list persists after completion for edit navigation | ✓ |
| Edit buttons on the Review step | Edit links per section on Review page | |
| Both | Sidebar labels AND edit buttons | |

**User's choice:** Step labels in sidebar (primary edit-mode UX)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard links to /interview, wizard fills main content area | Start Interview button → /interview in existing shell | ✓ |
| Wizard launches in full-screen overlay | Full-screen modal hiding shell | |

**User's choice:** Dashboard links to /interview, wizard inside existing shell

---

## Claude's Discretion

- Exact risk tolerance question text and scoring matrix
- Which fields are required vs optional within each wizard step
- wizardStep persistence approach (top-level plan field or local state)
- Visual treatment of "warned but allowed" incomplete fields
- Step completion indicators in the sidebar
- INT-08 pre-population UX (fields pre-filled from loaded plan data)

## Deferred Ideas

None — discussion stayed within phase scope.
