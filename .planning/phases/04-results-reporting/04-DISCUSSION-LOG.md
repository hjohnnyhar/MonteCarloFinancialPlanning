# Phase 4: Results & Reporting - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 04-results-reporting
**Areas discussed:** Results page structure, Headline score visual, Recommendations engine, PDF scope & approach, Year-by-year projection

---

## Results Page Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Enhance /simulation | Add recommendations + PDF + year-by-year to existing page | ✓ |
| New /results page | Clean read-only results at /results, /simulation stays as run+what-if | |

**User's choice:** Enhance /simulation

---

### What-If panel placement

| Option | Description | Selected |
|--------|-------------|----------|
| Keep What-If alongside | Same page as results, Phase 3 pattern preserved | ✓ |
| Collapse What-If to section | Hidden by default, user expands | |
| You decide | Claude picks layout | |

**User's choice:** Keep What-If alongside

---

## Headline Score Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Polished number + context text | Big % with color, label ("Strong plan"), one-liner explanation | ✓ |
| Circular progress ring | SVG ring gauge around the % number | |
| Grade letter + score | A/B/C/D/F grade displayed alongside % | |

**User's choice:** Polished number + context text

### Score thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Claude picks sensible financial planning thresholds | ✓ |
| Custom thresholds | User specifies exact breakpoints and label text | |

**User's choice:** You decide (Claude's discretion)

---

## Recommendations Engine

### Generation approach

| Option | Description | Selected |
|--------|-------------|----------|
| Computed rule-based | Server-side computes specific amounts ("Increase savings by $450/month to reach 90%") | ✓ |
| Score-range messages | Static text based on probability bucket | |

**User's choice:** Computed rule-based

### Levers

| Option | Description | Selected |
|--------|-------------|----------|
| Savings rate increase | "Increase savings from X% to Y%" | ✓ |
| Retirement age delay | "Delay retirement by N years" | ✓ |
| Monthly spending reduction | "Reduce monthly spending by $X" | ✓ |
| Goal target reduction | "Reduce purchase goal from $X to $Y" | ✓ |

**User's choice:** All four levers

### Quantity and visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Top 3, always shown | Show regardless of score | ✓ |
| Top 3, only when score < 80% | Hide for strong plans | |
| Top 1-3, adaptive | Only impactful ones | |

**User's choice:** Top 3, always shown

### API location

| Option | Description | Selected |
|--------|-------------|----------|
| Included in /api/simulate response | Extend SimulationResults.recommendations[] | ✓ |
| Separate /api/recommendations endpoint | Extra round-trip, cleaner separation | |

**User's choice:** Included in /api/simulate response

---

## Year-by-Year Projection

*This area emerged during PDF discussion — user mentioned wanting year-by-year results twice.*

### Scope decision

| Option | Description | Selected |
|--------|-------------|----------|
| Fold into Phase 4 | Expand Phase 4 scope to include median-path output + table + PDF | ✓ |
| Defer to Phase 5 | Keep Phase 4 to RSLT-01–04, year-by-year becomes its own phase | |
| PDF only | Year-by-year in PDF but not on screen | |

**User's choice:** Fold into Phase 4

### Per-row data

| Option | Description | Selected |
|--------|-------------|----------|
| Portfolio value (total assets) | Core metric per year | ✓ |
| Goal milestone markers | Highlight rows where goals are due | ✓ |
| Annual savings contribution | Salary × savings rate per year | ✓ |
| Annual withdrawal / spend | Draw-down in retirement years | ✓ |

**User's choice:** All four data points

### On-screen placement

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible section on /simulation | Below goal breakdown, hidden by default | ✓ |
| Separate /projection page | Dedicated page linked from /simulation | |
| PDF only | No on-screen view | |

**User's choice:** Collapsible section on /simulation

---

## PDF Scope & Approach

### Generation approach

| Option | Description | Selected |
|--------|-------------|----------|
| @react-pdf/renderer (client-side) | React components render to PDF blob in browser | ✓ |
| puppeteer (server-side) | Headless browser, pixel-perfect but ~300MB dep | |
| jsPDF + html2canvas | Screenshot-to-PDF, lower quality | |

**User's choice:** @react-pdf/renderer

### PDF contents

| Option | Description | Selected |
|--------|-------------|----------|
| Headline score + context label | Big % and label | ✓ |
| Goal-by-goal breakdown | Per-goal probability + funding gap | ✓ |
| Recommendations | All 3 with specific amounts | ✓ |
| Plan summary (inputs) | Age, income, savings rate, total assets | ✓ |
| Year-by-year detail table | Portfolio value, milestones, contributions, withdrawals | ✓ |

**User's choice:** All five sections (including year-by-year table)

---

## Claude's Discretion

- Score thresholds and label text for color tiers
- Recommendation computation logic (how to determine specific dollar amounts)
- Median-path extraction method from 10,000 runs
- PDF layout, typography, page breaks, filename
- Download button placement

## Deferred Ideas

None — all discussion items folded into Phase 4 scope.
