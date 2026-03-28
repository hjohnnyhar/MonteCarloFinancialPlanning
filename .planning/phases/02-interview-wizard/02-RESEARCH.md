# Phase 2: Interview Wizard - Research

**Researched:** 2026-03-28
**Domain:** React multi-step wizard form, per-step Zod validation, Next.js App Router routing, financial UX patterns
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INT-01 | User can start a new financial plan via a guided multi-step wizard | Wizard component with step index state; single `/interview` page with conditional step rendering |
| INT-02 | Wizard captures income & expenses (salary, monthly spend, savings rate) | Dedicated step component; `Income` + `Expenses` types already defined in `src/lib/types.ts` |
| INT-03 | Wizard captures assets & liabilities (accounts, investments, debts, net worth) | Dedicated step component; `Assets` + `Liabilities` types already defined |
| INT-04 | Wizard captures financial goals: retirement, purchases, education, legacy with target dates | Dynamic list UI for each `Goal` variant; all four `GoalType` discriminated union types defined |
| INT-05 | Wizard captures risk tolerance via questionnaire (maps to asset allocation assumptions) | Score 1–10 questionnaire → derived level; `RiskTolerance` type with `answers: Record<string, number>` already in types |
| INT-06 | User can save progress mid-interview and return to complete it later | Server-side persistence via existing `PUT /api/plan`; persist `wizardStep` index to plan JSON |
| INT-07 | User can edit any interview section after initial completion and re-run simulation | Step navigation always enabled for completed sections; sidebar or step-index click routes back |
| INT-08 | User (acting as advisor) can pre-populate known data fields before starting the interview | Pre-populate fields from `plan` loaded via `usePlan()`; no separate advisor UI needed for prototype |
</phase_requirements>

---

## Summary

Phase 2 builds the interview wizard on top of the existing Next.js 16 / React 19 / Tailwind v4 / TypeScript stack established in Phase 1. The data model in `src/lib/types.ts` is already complete — every field the wizard needs to capture exists. The persistence layer (`PUT /api/plan`, `usePlan` hook) is live and already auto-saves on every `updatePlan` call. Phase 2 is purely a UI build on top of proven plumbing.

The right approach for this prototype is a **single-page wizard** at `/interview` with step index stored in React state (and persisted to plan JSON as a `wizardStep` field). This avoids the routing complexity of per-step URL segments while still supporting deep-link resume via the persisted step index. Per-step validation uses **react-hook-form v7 + zod v4** with `zodResolver` — the same zod version already installed as a transitive dependency. Each wizard step is its own component that calls `updatePlan()` on "Next" and `trigger()` on validation.

The wizard has **6 logical sections**: (1) Income & Expenses, (2) Assets & Liabilities, (3) Financial Goals (with add/edit/remove), (4) Risk Tolerance questionnaire, (5) Review & confirm. The risk tolerance step maps a 1–10 score to conservative / moderate / aggressive using a short 4–5 question questionnaire.

**Primary recommendation:** Single-page wizard at `/interview`, step index in component state + persisted to `plan.wizardStep`, react-hook-form per step with zod schemas, `usePlan` for auto-save.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.72.0 | Per-step form state, validation triggering, dirty tracking | Minimal re-renders, uncontrolled inputs by default, battle-tested for multi-step wizards |
| zod | 4.3.6 | Per-step validation schemas, TypeScript type inference | Already a transitive dep; zodResolver bridges it to RHF; colocates validation with types |
| @hookform/resolvers | 5.2.2 | Bridges zod schemas into react-hook-form | Required adapter; same package family |

No additional state management library (Zustand, Redux) is needed. The existing `usePlan` hook with `deepMerge` already handles the plan state store and auto-save. Wizard step index lives in local component state.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation (built-in) | 16.2.1 | `useRouter`, `useSearchParams` for optional URL hash step | If URL-addressable steps become a requirement |

No additional dependencies needed for this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form + zod | Formik + yup | Formik has more re-renders; yup is not installed; RHF is lighter |
| Single-page step state | Per-URL-segment routing (/interview/step-1) | URL routing adds layout complexity, page transitions, and makes step-state sharing harder without global store |
| usePlan auto-save per step | Manual save button | Prototype already uses auto-save pattern; consistent experience |

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers
```

Zod is already installed as a transitive dep. Confirm it is available as a direct dep or add it:
```bash
npm install zod
```

**Version verification (confirmed 2026-03-28):**
- react-hook-form: 7.72.0 (npm registry)
- @hookform/resolvers: 5.2.2 (npm registry)
- zod: 4.3.6 (npm registry — already transitive dep)

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── interview/
│       └── page.tsx          # Wizard shell — owns stepIndex state, renders active step
├── components/
│   └── interview/
│       ├── WizardShell.tsx   # Progress bar, step titles, Back/Next nav buttons
│       ├── steps/
│       │   ├── IncomeExpensesStep.tsx
│       │   ├── AssetsLiabilitiesStep.tsx
│       │   ├── GoalsStep.tsx          # Add/edit/remove goal list
│       │   ├── RiskToleranceStep.tsx  # Questionnaire → score → level
│       │   └── ReviewStep.tsx         # Read-only summary with edit links
│       └── goals/
│           ├── RetirementGoalForm.tsx
│           ├── PurchaseGoalForm.tsx
│           ├── EducationGoalForm.tsx
│           └── LegacyGoalForm.tsx
├── lib/
│   ├── types.ts              # Already complete — all wizard types defined
│   ├── wizardSchemas.ts      # Per-step zod schemas (NEW)
│   └── riskToleranceQuestions.ts  # Question bank with scoring weights (NEW)
```

### Pattern 1: Single-Page Wizard with Persisted Step Index

**What:** One React page (`/interview/page.tsx`) owns a `stepIndex` integer in local state. The active step component renders conditionally. On mount, the step index is read from `plan.wizardStep` (a field to add to `FinancialPlan` or store separately in a `metadata`-adjacent field).

**When to use:** Single-user prototype where resume-from-server is the persistence model. URL routing would require global state for form values.

**Example:**
```typescript
// src/app/interview/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { WizardShell } from '@/components/interview/WizardShell';
import { WIZARD_STEPS } from '@/lib/wizardSteps';

export default function InterviewPage() {
  const { plan, isLoading, updatePlan } = usePlan();
  const [stepIndex, setStepIndex] = useState(0);

  // Resume from saved position on load
  useEffect(() => {
    if (plan?.metadata?.wizardStep !== undefined) {
      setStepIndex(plan.metadata.wizardStep);
    }
  }, [plan]);

  const handleNext = async (stepData: Partial<FinancialPlan>) => {
    const next = stepIndex + 1;
    await updatePlan({ ...stepData, metadata: { wizardStep: next } });
    setStepIndex(next);
  };

  const ActiveStep = WIZARD_STEPS[stepIndex].component;
  return (
    <WizardShell steps={WIZARD_STEPS} currentIndex={stepIndex} onStepClick={setStepIndex}>
      <ActiveStep plan={plan} onNext={handleNext} onBack={() => setStepIndex(s => s - 1)} />
    </WizardShell>
  );
}
```

### Pattern 2: Per-Step React Hook Form + Zod Validation

**What:** Each step component instantiates its own `useForm()` with a step-specific zod schema via `zodResolver`. The step calls `handleSubmit` which calls `onNext(data)` to propagate validated data up to the wizard shell.

**When to use:** Every wizard step — isolates validation scope, prevents schema bloat, keeps form re-render surface minimal.

**Example:**
```typescript
// src/lib/wizardSchemas.ts
import { z } from 'zod';

export const incomeExpensesSchema = z.object({
  income: z.object({
    salary: z.number().min(0, 'Must be 0 or more'),
    otherAnnualIncome: z.number().min(0),
    annualSavingsRate: z.number().min(0).max(1, 'Must be between 0 and 1'),
  }),
  expenses: z.object({
    monthlyEssential: z.number().min(0),
    monthlyDiscretionary: z.number().min(0),
    monthlyDebtPayments: z.number().min(0),
  }),
});

export type IncomeExpensesFormData = z.infer<typeof incomeExpensesSchema>;
```

```typescript
// src/components/interview/steps/IncomeExpensesStep.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeExpensesSchema, type IncomeExpensesFormData } from '@/lib/wizardSchemas';

interface Props {
  plan: FinancialPlan;
  onNext: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: () => void;
}

export function IncomeExpensesStep({ plan, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<IncomeExpensesFormData>({
    resolver: zodResolver(incomeExpensesSchema),
    defaultValues: { income: plan.income, expenses: plan.expenses },
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      {/* field groups */}
      <button type="button" onClick={onBack}>Back</button>
      <button type="submit">Next</button>
    </form>
  );
}
```

### Pattern 3: Dynamic Goals List (Add / Edit / Remove)

**What:** Goals are an array of discriminated union types. The Goals step renders an existing-goals list plus an "Add Goal" button that opens a goal-type picker, then a type-specific inline form.

**When to use:** INT-04 — retirement, purchase, education, legacy goals each have different fields.

**Implementation approach:**
- Local state `editingGoal: { index: number | null; goal: Partial<Goal> }` for the modal/inline form
- On save: call `updatePlan({ goals: [...existingGoals, newGoal] })` or splice for edits
- On remove: filter array and call `updatePlan({ goals: filtered })`
- Each goal sub-form has its own narrow zod schema

### Pattern 4: Risk Tolerance Scoring

**What:** 4–5 multiple-choice questions, each worth 1–3 points. Sum becomes the raw score (1–10 range after normalization). Score maps to level:

| Score | Level |
|-------|-------|
| 1–3 | conservative |
| 4–7 | moderate |
| 8–10 | aggressive |

The `RiskTolerance` type already has `answers: Record<string, number>` and `score: number` and `level`. The wizard step reads `plan.riskTolerance.answers` as `defaultValues`, scores on submit, and calls `updatePlan({ riskTolerance: { answers, score, level } })`.

**Example questions (industry standard, MEDIUM confidence):**
1. Investment time horizon (1 = < 2 years, 3 = > 15 years)
2. Reaction to 20% portfolio drop (1 = sell all, 3 = buy more)
3. Income stability (1 = variable/uncertain, 3 = stable/predictable)
4. Primary investment goal (1 = preserve capital, 3 = maximize growth)

### Anti-Patterns to Avoid

- **Single massive form for all steps:** React Hook Form re-renders the entire form on every keystroke; isolating per step avoids performance issues with 20+ fields.
- **Storing form values in global state instead of `usePlan`:** The `usePlan` hook already owns the plan state and auto-saves; duplicating in Zustand adds sync complexity with no benefit.
- **URL-per-step routing without a global form store:** Without shared state across routes, data entered in step 1 cannot be accessed in step 3 without re-fetching from server or passing through URL params.
- **Using `<input type="number">` directly for currency:** Native number inputs have UX problems (e.g., scroll-to-change). Use `<input type="text" inputMode="numeric">` with zod `z.coerce.number()` parsing for currency fields.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-step form validation | Custom validation state machine | react-hook-form + zodResolver | RHF handles dirty state, touched state, error display, and submission; dozens of edge cases in manual implementations |
| Schema type inference | Manual TypeScript interface + separate validator | `z.infer<typeof schema>` | Single source of truth; schema generates the type |
| Form default values from server | Manual field-by-field binding | `defaultValues` in `useForm()` | RHF handles initialization, reset, and dirty comparison |
| Currency number parsing | Custom string-to-number converter | `z.coerce.number()` in zod schema | Handles empty string, decimal precision, coercion from text inputs automatically |
| Wizard progress persistence | Custom localStorage sync | Persist `wizardStep` via existing `updatePlan` to server JSON | Reuses established auto-save plumbing; works across devices/browsers |

**Key insight:** The data model and persistence layer are already built and verified. Phase 2 is about layering UI on top of proven plumbing — resist the temptation to add complexity (Zustand, localStorage, new API routes).

---

## Common Pitfalls

### Pitfall 1: wizardStep Field Missing from FinancialPlan Type

**What goes wrong:** Storing step index only in component state means resume-on-reload doesn't work; INT-06 fails.
**Why it happens:** The `FinancialPlan` type in `types.ts` has no `wizardStep` field. It needs to be added to `PlanMetadata` or as a top-level field.
**How to avoid:** Add `wizardStep?: number` to `PlanMetadata` before building the wizard shell. The `deepMerge` in `usePlan` handles partial updates automatically.
**Warning signs:** Closing the app and reopening always returns to step 0.

### Pitfall 2: `useForm` defaultValues Not Updated After Plan Loads

**What goes wrong:** Form fields show 0/empty on first render if `plan` is null on initial load, then never reset when the plan data arrives.
**Why it happens:** `useForm({ defaultValues })` only reads `defaultValues` once on mount. If `plan` is loading asynchronously, the form initializes before data is available.
**How to avoid:** Use `reset(computedDefaults)` inside a `useEffect` that fires when `plan` transitions from `null` to a loaded value.
```typescript
useEffect(() => {
  if (plan) {
    reset({ income: plan.income, expenses: plan.expenses });
  }
}, [plan, reset]);
```
**Warning signs:** Fields initialize to 0 even after plan loads from server.

### Pitfall 3: Goals Array Mutation Instead of Replacement

**What goes wrong:** Directly mutating the `goals` array and passing to `updatePlan` may trigger no re-render since React/`deepMerge` detects array by reference.
**Why it happens:** Arrays in `deepMerge` are replaced wholesale (not deep-merged), which is correct for goals. But if you mutate the existing reference, the reference check passes and state doesn't update.
**How to avoid:** Always create a new array: `[...plan.goals, newGoal]`, `plan.goals.filter(...)`, or `plan.goals.map(...)`. Never push/splice.
**Warning signs:** Adding a goal doesn't appear in the list until page refresh.

### Pitfall 4: Saving on Every Keystroke (Debounce Not Needed)

**What goes wrong:** If `updatePlan` is wired to `onChange`, every character typed fires a PUT request.
**Why it happens:** Auto-save pattern is per-field if connected directly to onChange.
**How to avoid:** Only call `updatePlan` on step-level `handleSubmit` (Next/Save button), not per-field. The `usePlan` hook pattern is: user completes a section, clicks Next, that triggers validation and then `updatePlan`. This is already the right UX for a wizard.
**Warning signs:** Network tab shows a request for every keypress.

### Pitfall 5: Currency Input UX with `<input type="number">`

**What goes wrong:** Scroll wheel changes numeric values unexpectedly; mobile keyboards show minus signs; empty field is tricky to validate.
**Why it happens:** HTML number inputs have many browser-specific behaviors for financial inputs.
**How to avoid:** Use `<input type="text" inputMode="decimal" pattern="[0-9]*">` and parse with `z.coerce.number()` in the zod schema. Format display values as currency strings only in the Review step, not in the input itself.
**Warning signs:** Mobile users report numeric keyboard showing wrong symbols; scroll accidentally changes dollar values.

### Pitfall 6: zod v4 API Differences from v3

**What goes wrong:** Community tutorials show `z.number().nonnegative()` from zod v3. zod v4 has an updated API.
**Why it happens:** Many blog posts are written against zod v3.x. This project uses v4.3.6.
**How to avoid:** Check zod v4 docs directly. Key differences: error customization API changed; some methods renamed. Use `z.number().min(0)` (works in both). Avoid `z.number().nonnegative()` if unsure.
**Warning signs:** TypeScript type errors or runtime errors on schema methods.

---

## Code Examples

Verified patterns based on official library documentation:

### Wizard Step Configuration Array
```typescript
// src/lib/wizardSteps.ts
import type { ComponentType } from 'react';
import type { FinancialPlan } from './types';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 'income-expenses',      title: 'Income & Expenses',      description: 'Salary, savings rate, and monthly spending' },
  { id: 'assets-liabilities',   title: 'Assets & Liabilities',   description: 'Accounts, investments, and debts' },
  { id: 'goals',                title: 'Financial Goals',         description: 'Retirement, purchases, education, legacy' },
  { id: 'risk-tolerance',       title: 'Risk Tolerance',          description: 'Your investment comfort level' },
  { id: 'review',               title: 'Review & Confirm',        description: 'Confirm your information' },
];
```

### zod coerce for Currency Fields
```typescript
// In wizardSchemas.ts — handles text input that resolves to number
import { z } from 'zod';

const currencyField = z.coerce.number().min(0, 'Must be 0 or greater');

export const incomeExpensesSchema = z.object({
  income: z.object({
    salary: currencyField,
    otherAnnualIncome: currencyField,
    annualSavingsRate: z.coerce.number().min(0).max(1),
  }),
  expenses: z.object({
    monthlyEssential: currencyField,
    monthlyDiscretionary: currencyField,
    monthlyDebtPayments: currencyField,
  }),
});
```

### useForm with async defaultValues reset
```typescript
// Pattern for forms that load data async from usePlan
const { register, handleSubmit, reset, formState: { errors } } = useForm<IncomeExpensesFormData>({
  resolver: zodResolver(incomeExpensesSchema),
  defaultValues: { income: { salary: 0, otherAnnualIncome: 0, annualSavingsRate: 0 },
                   expenses: { monthlyEssential: 0, monthlyDiscretionary: 0, monthlyDebtPayments: 0 } },
});

useEffect(() => {
  if (plan) {
    reset({ income: plan.income, expenses: plan.expenses });
  }
}, [plan, reset]);
```

### Adding a Goal to the Goals Array
```typescript
// Correct — creates new array reference
const handleAddGoal = async (newGoal: Goal) => {
  await updatePlan({ goals: [...(plan?.goals ?? []), newGoal] });
};

// Correct — remove by index
const handleRemoveGoal = async (index: number) => {
  const updated = (plan?.goals ?? []).filter((_, i) => i !== index);
  await updatePlan({ goals: updated });
};
```

### Risk Tolerance Score Derivation
```typescript
// src/lib/riskToleranceQuestions.ts
export type RiskQuestion = {
  id: string;
  text: string;
  options: { label: string; value: number }[];
};

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'time_horizon',
    text: 'When do you expect to need most of this money?',
    options: [
      { label: 'Less than 2 years', value: 1 },
      { label: '2–10 years', value: 2 },
      { label: 'More than 10 years', value: 3 },
    ],
  },
  {
    id: 'loss_reaction',
    text: 'If your portfolio dropped 20% in one year, you would:',
    options: [
      { label: 'Sell everything', value: 1 },
      { label: 'Hold and wait', value: 2 },
      { label: 'Buy more', value: 3 },
    ],
  },
  {
    id: 'income_stability',
    text: 'How stable is your income?',
    options: [
      { label: 'Variable / uncertain', value: 1 },
      { label: 'Somewhat stable', value: 2 },
      { label: 'Very stable', value: 3 },
    ],
  },
  {
    id: 'goal_priority',
    text: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve capital', value: 1 },
      { label: 'Balance growth and safety', value: 2 },
      { label: 'Maximize long-term growth', value: 3 },
    ],
  },
];

export function deriveRiskLevel(score: number): 'conservative' | 'moderate' | 'aggressive' {
  if (score <= 5) return 'conservative';
  if (score <= 9) return 'moderate';
  return 'aggressive';
}

export function scoreFromAnswers(answers: Record<string, number>): number {
  const total = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const max = RISK_QUESTIONS.length * 3;
  // Normalize to 1–10
  return Math.round((total / max) * 9) + 1;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik for multi-step forms | react-hook-form v7 | ~2021 | RHF is now the dominant choice; Formik is maintained but not actively developed |
| Per-route wizard with next/router | Single-page step state | ~2023 App Router | App Router makes layout-level state sharing harder; single-page simpler for forms |
| localStorage for form persistence | Server persist via API | N/A | Project already has working server persistence; localStorage would be redundant |
| zod v3 schemas | zod v4 (installed: 4.3.6) | 2025 | API differences in error handling; use v4 docs specifically |

**Deprecated/outdated:**
- `z.number().nonnegative()`: Zod v4 changed some method signatures. Prefer `z.number().min(0)` which is stable across versions.
- Class-based Formik form management: Not applicable to this stack.

---

## Open Questions

1. **Where to store wizardStep index in FinancialPlan**
   - What we know: `PlanMetadata` has `createdAt`, `updatedAt`, `version`. `FinancialPlan` has no wizard-progress field.
   - What's unclear: Should `wizardStep` go in `metadata` (keeps it with audit fields) or as top-level `FinancialPlan.wizardStep`?
   - Recommendation: Add `wizardStep?: number` to `PlanMetadata` — it's operational metadata, not financial data. Planner should specify this in the types.ts task.

2. **Review step: read-only or editable inline**
   - What we know: INT-07 says user can edit any section after completion. This could mean clicking Back through the wizard or inline editing on a review page.
   - What's unclear: UX preference for edit flow.
   - Recommendation: Review step shows read-only summary cards, each with an "Edit" button that navigates back to the relevant step index. Simpler than inline editing.

3. **Goals step: inline expansion vs modal dialog**
   - What we know: No UI component library is currently installed (no Radix, no shadcn/ui, no Headless UI). Goals editing requires some kind of sub-form overlay.
   - What's unclear: Whether an inline expand/collapse pattern or a modal is preferred.
   - Recommendation: Use inline expand/collapse (no modal dependency) — a goal card shows summary; clicking "Add" or "Edit" expands a form beneath it. Avoids adding a dialog library.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev server, npm scripts | ✓ | v22.22.1 | — |
| npm | Package install | ✓ | 10.9.4 | — |
| Next.js dev server | UI rendering | ✓ | 16.2.1 | — |
| react-hook-form | Form management | ✗ (not yet installed) | — | Install: `npm install react-hook-form` |
| @hookform/resolvers | Zod bridge for RHF | ✗ (not yet installed) | — | Install with react-hook-form |
| zod | Validation schemas | ✓ (transitive dep 4.3.6) | 4.3.6 | Already available; add as direct dep |

**Missing dependencies with no fallback:**
- react-hook-form and @hookform/resolvers must be installed before any wizard step component can be built.

**Missing dependencies with fallback:**
- None beyond the above.

---

## Sources

### Primary (HIGH confidence)
- React Hook Form official docs (https://react-hook-form.com) — `useForm`, `zodResolver`, `handleSubmit`, `reset`, `defaultValues` patterns
- Zod v4 transitive installation verified via `npm list zod` on the target machine
- Package versions verified against npm registry 2026-03-28 via `npm view`

### Secondary (MEDIUM confidence)
- ClarityDev: Build a Multistep Form With React Hook Form — state management and per-step form patterns (https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form)
- LogRocket: Building a reusable multi-step form with React Hook Form and Zod (https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) — verified with official RHF docs
- Financial planning industry risk tolerance questionnaire structure (FPA, Morningstar, Lincoln Financial PDFs) — question types and score-to-level mapping

### Tertiary (LOW confidence)
- Risk question bank phrasing — adapted from common financial industry questionnaires; specific wording should be reviewed by a domain expert

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry; libraries verified as correct choice for RHF + zod on Next.js 16
- Architecture: HIGH — single-page wizard pattern verified as correct for App Router single-plan prototype; backed by multiple sources
- Pitfalls: HIGH — zod v4 API differences confirmed from installation; async defaultValues reset is a documented RHF pattern; array mutation pitfall is a React fundamentals issue
- Risk tolerance scoring: MEDIUM — question bank and scoring are based on industry standard patterns, not verified against a specific authoritative source

**Research date:** 2026-03-28
**Valid until:** 2026-06-28 (stable libraries — 90 days)
