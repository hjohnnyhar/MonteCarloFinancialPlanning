---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/types.ts
  - src/lib/planDefaults.ts
  - src/lib/wizardSchemas.ts
  - src/lib/wizardSteps.ts
  - src/lib/simulation.ts
  - src/lib/persistence.ts
  - src/lib/__tests__/simulation.test.ts
  - src/lib/__tests__/recommendations.test.ts
  - src/lib/__tests__/yearly-projection.test.ts
  - src/components/interview/steps/PeopleStep.tsx
  - src/components/interview/steps/IncomeExpensesStep.tsx
  - src/components/interview/steps/GoalsStep.tsx
  - src/components/interview/goals/RetirementGoalForm.tsx
  - src/app/interview/page.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can specify 1 or 2 people in the plan with name, sex, birthdate, salary, other income, and retirement age"
    - "Income & Expenses step no longer asks for currentAge, salary, or other income (moved to People)"
    - "Retirement goal form no longer asks for yearsInRetirement (derived from longevity)"
    - "Simulation derives currentAge from people[0].birthdate and phases income per-person by retirement age"
    - "Simulation horizon uses sex-based actuarial estimates (male=87, female=92, other=90)"
    - "Existing plans without people field load without crashing"
  artifacts:
    - path: "src/lib/types.ts"
      provides: "Person interface, people[] on FinancialPlan, no currentAge, no yearsInRetirement on RetirementGoal"
    - path: "src/components/interview/steps/PeopleStep.tsx"
      provides: "People step UI with 1/2 selector and person forms"
    - path: "src/lib/simulation.ts"
      provides: "Updated simulation using people[] for age, income phasing, and horizon"
  key_links:
    - from: "src/components/interview/steps/PeopleStep.tsx"
      to: "src/lib/types.ts"
      via: "Person interface"
      pattern: "Person"
    - from: "src/lib/simulation.ts"
      to: "src/lib/types.ts"
      via: "people array on FinancialPlan"
      pattern: "plan\\.people"
---

<objective>
Add multi-person (1-2 people) support to the financial planning interview wizard. This introduces a new "People" step as step 0, moves personal/income data from IncomeExpensesStep to PeopleStep, derives simulation parameters (currentAge, income phasing, plan horizon, yearsInRetirement) from people data, and removes now-redundant fields.

Purpose: Enable couples/partners to model joint financial plans with per-person income phasing and sex-based longevity estimates.
Output: Working People step, updated simulation engine, cleaned-up wizard flow.
</objective>

<execution_context>
@/home/john/.claude/get-shit-done/workflows/execute-plan.md
@/home/john/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/types.ts
@src/lib/simulation.ts
@src/lib/wizardSteps.ts
@src/lib/wizardSchemas.ts
@src/lib/planDefaults.ts
@src/lib/persistence.ts
@src/components/interview/steps/IncomeExpensesStep.tsx
@src/components/interview/steps/GoalsStep.tsx
@src/components/interview/goals/RetirementGoalForm.tsx
@src/app/interview/page.tsx
@src/lib/__tests__/simulation.test.ts

<interfaces>
<!-- Existing types the executor needs -->

From src/lib/types.ts:
```typescript
export interface FinancialPlan {
  metadata: PlanMetadata;
  currentAge: number;           // TO BE REMOVED
  income: Income;
  expenses: Expenses;
  assets: Assets;
  liabilities: Liabilities;
  goals: Goal[];
  riskTolerance: RiskTolerance;
  simulationResults: SimulationResults | null;
}

export interface Income {
  salary: number;               // TO BE REMOVED (moved to Person)
  otherAnnualIncome: number;    // TO BE REMOVED (moved to Person)
  annualSavingsRate: number;    // STAYS
}

export interface RetirementGoal {
  type: 'retirement';
  targetRetirementAge: number;
  desiredAnnualIncome: number;
  yearsInRetirement: number;    // TO BE REMOVED (derived from longevity)
}
```

From src/lib/wizardSteps.ts:
```typescript
export interface WizardStepConfig { id: string; title: string; description: string; }
export const WIZARD_STEPS: WizardStepConfig[] = [ /* 5 steps, index 0-4 */ ];
```

From src/lib/wizardSchemas.ts:
```typescript
export const incomeExpensesSchema = z.object({
  currentAge: ...,     // TO BE REMOVED
  income: z.object({
    salary: ...,       // TO BE REMOVED
    otherAnnualIncome: ..., // TO BE REMOVED
    annualSavingsRate: ..., // STAYS
  }),
  expenses: z.object({ ... }), // ALL STAY
});
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update types, schemas, defaults, and persistence for people support</name>
  <files>src/lib/types.ts, src/lib/planDefaults.ts, src/lib/wizardSchemas.ts, src/lib/wizardSteps.ts, src/lib/persistence.ts</files>
  <action>
**types.ts:**
- Add `Person` interface: `{ name: string; sex: 'male' | 'female' | 'other'; birthdate: string; annualSalary: number; otherAnnualIncome: number; retirementAge: number | null; }`
- Add `people: Person[]` to `FinancialPlan` (place it after `metadata`, before `income`)
- Remove `currentAge: number` from `FinancialPlan`
- Remove `yearsInRetirement: number` from `RetirementGoal`
- Remove `salary` and `otherAnnualIncome` from `Income` interface (keep only `annualSavingsRate`)

**planDefaults.ts:**
- Update `createEmptyPlan()`: remove `currentAge: 0`, add `people: []`
- Update default `income` to only have `annualSavingsRate: 0` (no salary/otherAnnualIncome)

**wizardSchemas.ts:**
- Add `personSchema = z.object({ name: z.string().min(1, 'Name is required.'), sex: z.enum(['male', 'female', 'other']), birthdate: z.string().min(1, 'Date of birth is required.'), annualSalary: z.coerce.number().min(0), otherAnnualIncome: z.coerce.number().min(0), retirementAge: z.coerce.number().min(1).nullable() })`
- Add `peopleSchema = z.object({ people: z.array(personSchema).min(1, 'At least one person is required.') })`
- Export `PeopleFormData` type from `peopleSchema`
- Update `incomeExpensesSchema`: remove `currentAge`, remove `income.salary`, remove `income.otherAnnualIncome`. Schema becomes `z.object({ income: z.object({ annualSavingsRate: rateField }), expenses: z.object({ monthlyEssential: currencyField, monthlyDiscretionary: currencyField, monthlyDebtPayments: currencyField }) })`
- Update `IncomeExpensesFormData` type export
- Update `retirementGoalSchema`: remove `yearsInRetirement` field. Schema becomes `z.object({ type: z.literal('retirement'), targetRetirementAge: z.coerce.number().min(1, 'Required.'), desiredAnnualIncome: currencyField })`

**wizardSteps.ts:**
- Insert People step at index 0: `{ id: 'people', title: 'People', description: "Who's in the plan?" }`
- Existing steps shift: Income & Expenses becomes index 1, Assets & Liabilities index 2, Goals index 3, Risk Tolerance index 4, Review index 5
- Total steps: 6

**persistence.ts:**
- In `readPlan()`, the back-fill via `{ ...defaults, ...parsed }` already handles missing `people` field since `createEmptyPlan()` now includes `people: []`. However, old plans will still have `currentAge`, `income.salary`, `income.otherAnnualIncome` on disk -- these are harmless extra fields that TypeScript will ignore. No additional persistence changes needed beyond what planDefaults provides.
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>Person type exists, FinancialPlan has people[] without currentAge, Income has only annualSavingsRate, RetirementGoal has no yearsInRetirement, wizardSteps has 6 entries starting with People, schemas updated, planDefaults updated. TypeScript compiles (note: compile errors in consuming files expected -- they are fixed in subsequent tasks).</done>
</task>

<task type="auto">
  <name>Task 2: Create PeopleStep, update IncomeExpensesStep, GoalsStep, RetirementGoalForm, and interview page</name>
  <files>src/components/interview/steps/PeopleStep.tsx, src/components/interview/steps/IncomeExpensesStep.tsx, src/components/interview/goals/RetirementGoalForm.tsx, src/components/interview/steps/GoalsStep.tsx, src/app/interview/page.tsx</files>
  <action>
**PeopleStep.tsx** -- Create new component following existing step patterns (raw Tailwind v4, font-normal/font-semibold only, card pattern `rounded-lg border border-gray-200 bg-white p-6`):

Props: `{ plan: FinancialPlan; onComplete: (data: Partial<FinancialPlan>) => Promise<void>; onBack: null; }`

State: `personCount` (1 or 2, initialized from `plan.people.length || 1`), managed with useState.

UI flow:
1. "How many people in this plan?" -- two buttons styled as selectable cards: "Just me (1)" and "My partner and me (2)". Active button gets blue border/bg highlight.
2. Below that, a card for Person 1 with header "Primary Person" containing fields: First name (text), Sex (radio group: Male/Female/Other), Date of birth (input type="date"), Annual salary (text inputMode="decimal"), Other annual income (text inputMode="decimal"), Retirement age (text inputMode="numeric") -- only show retirement age if annualSalary > 0 or otherAnnualIncome > 0.
3. If personCount === 2, show a second card with header "Second Person" and the same fields.

Use react-hook-form with zodResolver and the `peopleSchema`. Default values from `plan.people` if non-empty, else one empty person. On personCount change: if going from 2 to 1, remove second person from form array; if going from 1 to 2, append empty person.

Use `useFieldArray` from react-hook-form for the `people` array. The retirement age field should conditionally render based on watching the person's annualSalary and otherAnnualIncome values with `watch`.

On Next: parse form through schema, call `onComplete({ people: parsedPeople })`.

Follow the existing pattern: `zodResolver(peopleSchema) as unknown as Resolver<PeopleFormData>` for the resolver cast. Use the same input class pattern as IncomeExpensesStep. Navigation: no Back button (first step), Next button in the standard footer position.

**IncomeExpensesStep.tsx:**
- Remove currentAge field (entire flex-col div)
- Remove "Income" section header and salary/otherAnnualIncome fields
- Keep only: annualSavingsRate (under a "Savings" header), and the entire "Monthly Expenses" section unchanged
- Update defaultValues to match new schema: `{ income: { annualSavingsRate: 0 }, expenses: { ... } }`
- Update reset effect: `reset({ income: { annualSavingsRate: plan.income.annualSavingsRate }, expenses: plan.expenses })`
- Update handleNext: `await onComplete({ income: values.income, expenses: values.expenses })` (no currentAge)
- onBack prop is now always provided (People step is before it), so it always shows Back button

**RetirementGoalForm.tsx:**
- Remove the `yearsInRetirement` input field and its label/error display
- Remove `yearsInRetirement` from defaultValues (was 30)
- The form now only collects targetRetirementAge and desiredAnnualIncome
- Update the form's onSave handler to not include yearsInRetirement

**GoalsStep.tsx:**
- In `getGoalDetails()`, update the retirement case: instead of showing `${goal.yearsInRetirement} years in retirement`, show `Retire at age ${goal.targetRetirementAge}` (since yearsInRetirement no longer exists on the type)
- In `getGoalSummary()`, the retirement case already uses targetRetirementAge and desiredAnnualIncome -- no change needed there

**interview/page.tsx:**
- Add import for PeopleStep
- case 0: render PeopleStep with `onBack={null}`
- case 1: IncomeExpensesStep with `onBack={handleBack}`
- case 2: AssetsLiabilitiesStep with `onBack={handleBack}`
- case 3: GoalsStep with `onBack={handleBack}` and `updatePlan={updatePlan}`
- case 4: RiskToleranceStep with `onBack={handleBack}`
- case 5: ReviewStep with `onComplete={handleFinish}` and `goToStep={goToStep}`
- Update `handleFinish`: `await updatePlan({ metadata: { wizardStep: 5 } })` (was 4)
- The resume logic via `plan.metadata.wizardStep` still works correctly since wizardStep is the raw index
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>PeopleStep renders with 1/2 person selector and person forms. IncomeExpensesStep only shows savings rate and expenses. RetirementGoalForm has no yearsInRetirement field. Interview page has 6 cases (0-5). TypeScript compiles clean (note: simulation.ts errors may remain -- fixed in Task 3).</done>
</task>

<task type="auto">
  <name>Task 3: Update simulation engine and tests for people-based calculations</name>
  <files>src/lib/simulation.ts, src/lib/__tests__/simulation.test.ts, src/lib/__tests__/recommendations.test.ts, src/lib/__tests__/yearly-projection.test.ts</files>
  <action>
**simulation.ts** -- Update all simulation logic to derive values from `plan.people[]`:

Add actuarial constants at top:
```typescript
const EXPECTED_DEATH_AGE: Record<'male' | 'female' | 'other', number> = {
  male: 87, female: 92, other: 90,
};
```

Add helper function:
```typescript
function deriveCurrentAge(birthdate: string): number {
  return Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}
```

Key changes throughout `runSimulation`, `runLightweightSim`, `extractMedianPath`:

1. **currentAge**: Replace all `plan.currentAge` with `deriveCurrentAge(plan.people[0].birthdate)`. Add guard: if `plan.people.length === 0` throw `Error('At least one person is required')`. Remove the old `if (!plan.currentAge || plan.currentAge <= 0)` validation.

2. **Annual income per year**: Replace the fixed `annualSavings = (plan.income.salary + plan.income.otherAnnualIncome) * resolvedSavingsRate` with a year-aware function. Inside `simulateOnePath`, compute income for each yearIndex by summing across people: for each person, if `person.retirementAge !== null && (currentAge + yearIndex) < person.retirementAge`, add `person.annualSalary + person.otherAnnualIncome`. Multiply total household income by `resolvedSavingsRate` to get that year's savings.

   This means `simulateOnePath` signature changes: instead of receiving a fixed `annualSavings`, receive `people: Person[]`, `currentAge: number`, and `resolvedSavingsRate: number`, and compute savings inside the year loop.

   Similarly update the `annualSavings` used in `extractMedianPath` to be year-aware (compute per year in the loop).

3. **Plan horizon**: Instead of computing from `yearsToRetirement + yearsInRetirement`, compute `simulationEndAge = max(EXPECTED_DEATH_AGE[person.sex] for each person in plan.people)`. Plan horizon = `simulationEndAge - currentAge`. Still respect `Math.max(30, ...)` as minimum.

4. **yearsToRetirement**: Use the FIRST retirement from `resolvedRetirementAge - currentAge` as before. `resolvedRetirementAge` still comes from retirement goal's `targetRetirementAge` (or override).

5. **yearsInRetirement** (used in `computeInflatedTarget` for retirement goal): Derive as `simulationEndAge - resolvedRetirementAge`. Pass this to `computeInflatedTarget` instead of reading `goal.yearsInRetirement`. Update `computeInflatedTarget` signature to accept `yearsInRetirement` as a parameter instead of reading it from the goal.

6. **Inflated annual withdrawal**: Still uses `retirementGoal.desiredAnnualIncome * Math.pow(1 + INFLATION_RATE, yearsToRetirement)`.

7. **goalResults targetAmount for retirement**: Was `goal.desiredAnnualIncome * goal.yearsInRetirement`. Now use `goal.desiredAnnualIncome * derivedYearsInRetirement`.

8. In `computeRecommendations`, the `annualSavings` calculation for the savings_increase lever and spending_reduction lever: replace `plan.income.salary + plan.income.otherAnnualIncome` with summing all people's `annualSalary + otherAnnualIncome` (total household income at year 0 -- for recommendation display purposes, using initial total is fine).

9. In `extractMedianPath`, the `annualSavings` snapshot for each year should reflect per-year income phasing (same logic as in simulateOnePath).

**Test files** -- Update `makeTestPlan` helper in all test files:
- Replace `currentAge: 35` with `people: [{ name: 'Test', sex: 'male' as const, birthdate: '1991-01-01', annualSalary: 100000, otherAnnualIncome: 0, retirementAge: 65 }]`
- Remove `income.salary` and `income.otherAnnualIncome` from the income object (keep `annualSavingsRate`)
- Remove `yearsInRetirement` from retirement goal objects
- Fix any assertions that reference `yearsInRetirement` or `currentAge` directly
- Ensure tests still validate the same behaviors (probability ranges, goal results structure, etc.)
- The `currentAge` derived from '1991-01-01' will be ~35 (close enough for the probabilistic tests)
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx vitest run 2>&1 | tail -30</automated>
  </verify>
  <done>Simulation derives currentAge from people[0].birthdate, phases household income year-by-year per person's retirement age, uses sex-based actuarial longevity for horizon, derives yearsInRetirement from longevity. All tests pass. `npx tsc --noEmit` is clean.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` -- zero TypeScript errors
2. `npx vitest run` -- all existing + updated tests pass
3. `npm run dev` -- app starts, navigate to /interview, People step appears first
4. Complete People step with 1 person, verify Income & Expenses step no longer shows age/salary
5. Add a retirement goal, verify no yearsInRetirement field
6. Complete full wizard flow through to simulation -- results page shows probability score
</verification>

<success_criteria>
- People step collects 1-2 people with name, sex, birthdate, salary, other income, retirement age
- IncomeExpensesStep only shows savings rate and expenses (no age, salary, otherIncome)
- RetirementGoalForm has no yearsInRetirement field
- Simulation uses people[0].birthdate for age, phases income per-person, uses actuarial longevity
- All vitest tests pass
- TypeScript compiles clean
- Existing saved plans without people field load without crashing
</success_criteria>

<output>
After completion, create `.planning/quick/260329-kyl-add-people-step-to-interview-wizard-for-/260329-kyl-SUMMARY.md`
</output>
