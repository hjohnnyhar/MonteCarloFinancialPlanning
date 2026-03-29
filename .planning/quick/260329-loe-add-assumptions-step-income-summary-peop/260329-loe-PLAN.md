---
phase: quick
plan: 260329-loe
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/types.ts
  - src/lib/planDefaults.ts
  - src/lib/wizardSteps.ts
  - src/lib/wizardSchemas.ts
  - src/components/interview/steps/AssumptionsStep.tsx
  - src/app/interview/page.tsx
  - src/components/interview/steps/GoalsStep.tsx
  - src/components/interview/goals/RetirementGoalForm.tsx
  - src/lib/simulation.ts
  - src/app/simulation/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Wizard has 7 steps: People, Plan Assumptions, Income & Expenses, Assets & Liabilities, Goals, Risk Tolerance, Review"
    - "User can set four inflation rates and a Social Security toggle on the Assumptions step"
    - "Inflation inputs display/accept percentage values (e.g., 2.5) but store as decimals (0.025)"
    - "Retirement goal form pre-fills targetRetirementAge from first person's retirementAge"
    - "Simulation uses plan.planAssumptions.goodsInflation instead of hardcoded 0.03"
    - "Simulation results page shows Household Income summary card"
    - "Person income stops at min(retirementAge, expectedDeathAge) in simulation"
  artifacts:
    - path: "src/components/interview/steps/AssumptionsStep.tsx"
      provides: "Plan Assumptions wizard step"
      min_lines: 60
    - path: "src/lib/types.ts"
      provides: "PlanAssumptions interface and planAssumptions field on FinancialPlan"
      contains: "PlanAssumptions"
    - path: "src/lib/planDefaults.ts"
      provides: "Default planAssumptions in createEmptyPlan"
      contains: "planAssumptions"
  key_links:
    - from: "src/components/interview/steps/AssumptionsStep.tsx"
      to: "src/lib/types.ts"
      via: "PlanAssumptions type import"
      pattern: "import.*PlanAssumptions"
    - from: "src/lib/simulation.ts"
      to: "plan.planAssumptions"
      via: "inflation rate from plan"
      pattern: "planAssumptions.*goodsInflation"
---

<objective>
Add Plan Assumptions wizard step, income summary on results page, people-aware goal pre-fill, and survivor income model in simulation.

Purpose: Enable user-configurable inflation rates, show household income breakdown on results, pre-fill retirement age from People step, and correctly model income stopping at death.
Output: New AssumptionsStep component, updated wizard flow (7 steps), updated simulation engine, household income card on results page.
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@src/lib/types.ts
@src/lib/planDefaults.ts
@src/lib/wizardSteps.ts
@src/lib/wizardSchemas.ts
@src/app/interview/page.tsx
@src/lib/simulation.ts
@src/app/simulation/page.tsx
@src/components/interview/steps/GoalsStep.tsx
@src/components/interview/goals/RetirementGoalForm.tsx
@src/lib/formatters.ts
@src/components/interview/steps/IncomeExpensesStep.tsx

<interfaces>
<!-- Existing types/patterns the executor needs -->

From src/lib/types.ts:
```typescript
export interface FinancialPlan {
  metadata: PlanMetadata;
  people: Person[];
  income: Income;
  expenses: Expenses;
  assets: Assets;
  liabilities: Liabilities;
  goals: Goal[];
  riskTolerance: RiskTolerance;
  simulationResults: SimulationResults | null;
}

export interface Person {
  name: string;
  sex: 'male' | 'female' | 'other';
  birthdate: string;
  annualSalary: number;
  otherAnnualIncome: number;
  retirementAge: number | null;
}
```

From src/lib/simulation.ts:
```typescript
export const INFLATION_RATE = 0.03;  // To be replaced with plan.planAssumptions.goodsInflation
const EXPECTED_DEATH_AGE: Record<'male' | 'female' | 'other', number> = { male: 87, female: 92, other: 90 };
function computeHouseholdIncome(people: Person[], currentAge: number, yearIndex: number): number
```

From src/lib/wizardSchemas.ts (pattern for schema + resolver):
```typescript
const currencyField = z.coerce.number().min(0, 'Must be 0 or greater.');
// zodResolver v5 requires: as unknown as Resolver<T> cast
```

From src/components/interview/steps/IncomeExpensesStep.tsx (step component pattern):
```typescript
interface StepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: (() => void) | null;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Types, schema, defaults, and AssumptionsStep component</name>
  <files>
    src/lib/types.ts
    src/lib/planDefaults.ts
    src/lib/wizardSteps.ts
    src/lib/wizardSchemas.ts
    src/components/interview/steps/AssumptionsStep.tsx
    src/app/interview/page.tsx
  </files>
  <action>
1. **src/lib/types.ts** — Add `PlanAssumptions` interface before `FinancialPlan`:
   ```typescript
   export interface PlanAssumptions {
     goodsInflation: number;       // decimal, e.g. 0.025
     servicesInflation: number;
     healthcareInflation: number;
     educationInflation: number;
     includeSocialSecurity: boolean;
   }
   ```
   Add `planAssumptions: PlanAssumptions;` to `FinancialPlan` interface (after `people`).

2. **src/lib/planDefaults.ts** — Add `planAssumptions` to `createEmptyPlan()` return:
   ```typescript
   planAssumptions: {
     goodsInflation: 0.025,
     servicesInflation: 0.025,
     healthcareInflation: 0.025,
     educationInflation: 0.025,
     includeSocialSecurity: false,
   },
   ```
   Place it after `people: []`.

3. **src/lib/wizardSchemas.ts** — Add assumptions schema:
   ```typescript
   const percentAsDecimal = z.coerce.number().min(0).max(100).transform(v => v / 100);

   export const assumptionsSchema = z.object({
     planAssumptions: z.object({
       goodsInflation: percentAsDecimal,
       servicesInflation: percentAsDecimal,
       healthcareInflation: percentAsDecimal,
       educationInflation: percentAsDecimal,
       includeSocialSecurity: z.boolean(),
     }),
   });

   export type AssumptionsFormData = z.infer<typeof assumptionsSchema>;
   ```
   NOTE: The form fields will use percentage display values (user types "2.5"), and the schema transform converts to decimal (0.025) on parse. The `percentAsDecimal` field should validate the INPUT range (0-100 as a percentage), not the output.

4. **src/lib/wizardSteps.ts** — Insert at index 1:
   ```typescript
   { id: 'assumptions', title: 'Plan Assumptions', description: 'Inflation and planning parameters' },
   ```
   Resulting order: People (0), Plan Assumptions (1), Income & Expenses (2), Assets & Liabilities (3), Goals (4), Risk Tolerance (5), Review (6).

5. **src/components/interview/steps/AssumptionsStep.tsx** — Create new component following IncomeExpensesStep pattern:
   - Import `useForm`, `zodResolver`, `useEffect` from react-hook-form and react.
   - Use `StepProps` pattern: `{ plan, onComplete, onBack }`.
   - Use `assumptionsSchema` with `zodResolver` (apply `as unknown as Resolver<AssumptionsFormData>` cast per project convention).
   - `defaultValues`: all four inflation fields set to `2.5` (display percentage), `includeSocialSecurity: false`.
   - `useEffect` to `reset` from plan data: multiply stored decimals by 100 for display (e.g., `plan.planAssumptions.goodsInflation * 100`).
   - `handleNext`: call `trigger()`, then `assumptionsSchema.parse(getValues())` to coerce and transform, then `onComplete({ planAssumptions: parsed.planAssumptions })`.
   - Render 4 numeric inputs in a card (`rounded-lg border border-gray-200 bg-white p-6`):
     - "Goods Inflation (%)" — `register('planAssumptions.goodsInflation')`
     - "Services Inflation (%)" — `register('planAssumptions.servicesInflation')`
     - "Healthcare Inflation (%)" — `register('planAssumptions.healthcareInflation')`
     - "Education Inflation (%)" — `register('planAssumptions.educationInflation')`
   - Each input: `type="text" inputMode="decimal"`, placeholder "2.5", same Tailwind classes as IncomeExpensesStep inputs.
   - Below inputs: Social Security toggle using a checkbox with label "Include Social Security estimates". Style: `<label>` with flex row, checkbox + text.
   - Navigation: Back and Next buttons, same pattern as IncomeExpensesStep. `onBack` is a function (not null) since People step precedes this.
   - Use `font-normal` for labels, `font-semibold` for section headings and buttons.

6. **src/app/interview/page.tsx** — Update:
   - Import `AssumptionsStep` from `@/components/interview/steps/AssumptionsStep`.
   - Update `renderStep()` switch:
     - case 0: PeopleStep (unchanged)
     - case 1: AssumptionsStep with `plan={plan} onComplete={handleStepComplete} onBack={handleBack}`
     - case 2: IncomeExpensesStep (was case 1)
     - case 3: AssetsLiabilitiesStep (was case 2)
     - case 4: GoalsStep (was case 3)
     - case 5: RiskToleranceStep (was case 4)
     - case 6: ReviewStep (was case 5)
   - Update `handleFinish` to save `wizardStep: 6` (was 5) since there are now 7 steps (indices 0-6, and finish saves the count to mark completion).
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - PlanAssumptions type exists with 4 inflation fields + boolean toggle
    - FinancialPlan includes planAssumptions field
    - createEmptyPlan includes planAssumptions defaults (all 0.025, SS off)
    - WIZARD_STEPS has 7 entries with "Plan Assumptions" at index 1
    - AssumptionsStep component renders 4 percentage inputs + SS toggle
    - interview/page.tsx routes case 1 to AssumptionsStep, all other cases shifted +1
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Goal pre-fill, simulation survivor model, and inflation from plan</name>
  <files>
    src/components/interview/goals/RetirementGoalForm.tsx
    src/components/interview/steps/GoalsStep.tsx
    src/lib/simulation.ts
  </files>
  <action>
1. **src/components/interview/goals/RetirementGoalForm.tsx** — Add `plan` prop:
   - Update `RetirementGoalFormProps` to include `plan?: FinancialPlan` (import FinancialPlan from types).
   - Change `defaultValues` to use `plan?.people?.[0]?.retirementAge ?? 65` for `targetRetirementAge` when no `initialData` is provided:
     ```typescript
     defaultValues: initialData ?? {
       type: 'retirement' as const,
       targetRetirementAge: plan?.people?.[0]?.retirementAge ?? 65,
       desiredAnnualIncome: 0,
     },
     ```

2. **src/components/interview/steps/GoalsStep.tsx** — Pass `plan` to RetirementGoalForm:
   - In `renderGoalForm`, for the `case 'retirement':` branch, add `plan={plan}` prop to `<RetirementGoalForm>`.

3. **src/lib/simulation.ts** — Three changes:

   a. **Replace hardcoded INFLATION_RATE with plan-aware inflation.** The exported `INFLATION_RATE` constant stays for backwards compat but is no longer used internally. Create a helper:
      ```typescript
      function getInflationRate(plan: FinancialPlan): number {
        return plan.planAssumptions?.goodsInflation ?? 0.025;
      }
      ```
      Then thread `inflationRate` through all functions that currently use `INFLATION_RATE`:
      - `simulateOnePath`: add `inflationRate: number` parameter. Replace all `INFLATION_RATE` references with it.
      - `computeInflatedTarget`: add `inflationRate: number` parameter. Replace `INFLATION_RATE` with it.
      - `runSimulation`: call `const inflationRate = getInflationRate(plan);` early, pass to simulateOnePath and computeInflatedTarget. Update `assumptions.inflationRate` in the return to use `inflationRate` instead of `INFLATION_RATE`.
      - `runLightweightSim`: same — compute `inflationRate` from plan, pass to simulateOnePath.
      - `extractMedianPath`: same pattern.
      - Legacy goal check in `simulateOnePath` (line ~157): replace `INFLATION_RATE` with `inflationRate` parameter.

   b. **Survivor model for income.** In `computeHouseholdIncome`, update the income-stop condition. Currently income stops only at `retirementAge`. It should also stop at death:
      ```typescript
      function computeHouseholdIncome(people: Person[], currentAge: number, yearIndex: number): number {
        return people.reduce((total, person) => {
          const personCurrentAge = deriveCurrentAge(person.birthdate);
          const personAgeAtYear = personCurrentAge + yearIndex;
          const deathAge = EXPECTED_DEATH_AGE[person.sex];
          // Income stops at the earlier of retirement or death
          const incomeEndAge = person.retirementAge !== null
            ? Math.min(person.retirementAge, deathAge)
            : deathAge;
          if (personAgeAtYear < incomeEndAge) {
            return total + person.annualSalary + person.otherAnnualIncome;
          }
          return total;
        }, 0);
      }
      ```
      This ensures if someone dies before retiring, their income stops at death not retirement.

   c. **Verify simulation horizon.** Check `deriveSimulationEndAge` — it already returns `Math.max(...people.map(p => EXPECTED_DEATH_AGE[p.sex]))` which is correct. The `planHorizon` calculation already uses `simulationEndAge - currentAge`. No change needed here.
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -30 && npx vitest run 2>&1 | tail -20</automated>
  </verify>
  <done>
    - RetirementGoalForm pre-fills targetRetirementAge from plan.people[0].retirementAge
    - simulation.ts uses plan.planAssumptions.goodsInflation instead of hardcoded INFLATION_RATE for all inflation calculations
    - computeHouseholdIncome stops income at min(retirementAge, expectedDeathAge)
    - All existing tests still pass (52+)
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Household Income card on simulation results page</name>
  <files>
    src/app/simulation/page.tsx
  </files>
  <action>
Add a "Household Income" card to the simulation results page, positioned after the overall probability score card and before the goal breakdown card.

In `src/app/simulation/page.tsx`:

1. Compute household income values from `plan.people` (only render if at least 1 person has income > 0):
   ```typescript
   const householdIncome = plan?.people?.reduce((sum, p) => sum + p.annualSalary + p.otherAnnualIncome, 0) ?? 0;
   const hasIncome = householdIncome > 0;
   ```

2. After the overall probability `<div>` block (around line 132, before the per-goal breakdown), insert:
   ```tsx
   {plan && hasIncome && (
     <div className="rounded-lg border border-gray-200 bg-white p-6">
       <h2 className="text-base font-semibold text-gray-900 mb-2">Household Income</h2>
       {plan.people.length === 2 ? (
         <>
           <div className="space-y-1">
             {plan.people.map((person, i) => {
               const personIncome = person.annualSalary + person.otherAnnualIncome;
               return personIncome > 0 ? (
                 <p key={i} className="text-sm text-gray-600">
                   {person.name}: {formatCurrency(personIncome)}/year
                 </p>
               ) : null;
             })}
           </div>
           <p className="mt-2 text-lg font-semibold text-gray-900">
             Total: {formatCurrency(householdIncome)}/year
           </p>
         </>
       ) : (
         <p className="text-lg font-semibold text-gray-900">
           {formatCurrency(householdIncome)}/year
         </p>
       )}
     </div>
   )}
   ```
   Use `formatCurrency` already imported from `@/lib/formatters`.

3. Move the `householdIncome` and `hasIncome` computation inside the `{results && ( ... )}` block so it only runs when plan is available.
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Simulation results page shows "Household Income" card between probability score and goal breakdown
    - For 2-person plans, shows each person's name and income contribution plus total
    - For 1-person plans, shows single total
    - Card only appears when at least one person has income > 0
    - Uses formatCurrency from formatters.ts
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npx vitest run` — all tests pass (52+ existing)
3. Manual: Navigate wizard — 7 steps in correct order (People -> Plan Assumptions -> Income & Expenses -> Assets & Liabilities -> Goals -> Risk Tolerance -> Review)
4. Manual: Assumptions step shows 4 inflation fields pre-filled with 2.5 (%) and SS toggle off
5. Manual: Enter inflation values, proceed, come back — values persist correctly
6. Manual: On Goals step, add a Retirement goal — targetRetirementAge pre-filled from person's retirement age
7. Manual: Run simulation — results page shows Household Income card with correct values
</verification>

<success_criteria>
- Wizard has 7 steps with Plan Assumptions at index 1
- Inflation values stored as decimals, displayed as percentages
- Simulation uses plan-level inflation instead of hardcoded 0.03
- Person income stops at min(retirementAge, expectedDeathAge) in simulation
- Retirement goal form pre-fills age from first person
- Household Income card renders on results page
- All existing tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260329-loe-add-assumptions-step-income-summary-peop/260329-loe-SUMMARY.md`
</output>
