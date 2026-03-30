---
phase: quick
plan: 260330-pit
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/supabase.ts
  - src/lib/types.ts
  - src/lib/planDefaults.ts
  - src/lib/persistence.ts
  - src/lib/__tests__/persistence.test.ts
  - src/lib/generatePlanId.ts
  - src/app/api/plan/route.ts
  - src/app/api/plan/create/route.ts
  - src/app/api/simulate/route.ts
  - src/hooks/usePlan.ts
  - src/app/page.tsx
  - src/app/interview/page.tsx
  - src/app/simulation/page.tsx
  - src/components/Sidebar.tsx
  - package.json
autonomous: true
requirements: []
must_haves:
  truths:
    - "Preparer can enter their name and start a new plan from the home page"
    - "Plans are stored in Supabase (not filesystem) and persist across server restarts"
    - "planId is passed via URL search params so multiple plans can coexist"
    - "Existing plan can be loaded by entering its planId"
    - "Interview and simulation pages read planId from URL and operate on that plan"
    - "Sidebar nav links include planId query param when known"
  artifacts:
    - path: "src/lib/supabase.ts"
      provides: "Supabase client singleton"
    - path: "src/lib/persistence.ts"
      provides: "Supabase-backed readPlan/writePlan"
    - path: "src/lib/generatePlanId.ts"
      provides: "planId generation from name + date"
    - path: "src/app/page.tsx"
      provides: "Preparer entry screen"
    - path: "src/app/api/plan/create/route.ts"
      provides: "POST endpoint to create new plan"
  key_links:
    - from: "src/app/page.tsx"
      to: "/api/plan/create"
      via: "POST fetch on Start Plan click"
      pattern: "fetch.*api/plan/create"
    - from: "src/hooks/usePlan.ts"
      to: "/api/plan?planId="
      via: "useSearchParams + fetch"
      pattern: "searchParams.*planId"
    - from: "src/lib/persistence.ts"
      to: "supabase.from('plans')"
      via: "Supabase client queries"
      pattern: "supabase.*from.*plans"
---

<objective>
Migrate plan storage from filesystem JSON to Supabase, add planId/preparerName to metadata, replace the dashboard with a preparer entry screen, and thread planId through all pages via URL search params.

Purpose: Enable multi-plan support with cloud persistence so plans survive server restarts and multiple preparers can work independently.
Output: Supabase-backed persistence, preparer entry screen, planId-aware pages and API routes.
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@src/lib/types.ts
@src/lib/planDefaults.ts
@src/lib/persistence.ts
@src/lib/__tests__/persistence.test.ts
@src/hooks/usePlan.ts
@src/app/api/plan/route.ts
@src/app/api/simulate/route.ts
@src/app/page.tsx
@src/app/interview/page.tsx
@src/app/simulation/page.tsx
@src/components/Sidebar.tsx

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/lib/types.ts:
```typescript
export interface PlanMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  wizardStep?: number;
}

export interface FinancialPlan {
  metadata: PlanMetadata;
  people: Person[];
  planAssumptions: PlanAssumptions;
  income: Income;
  expenses: Expenses;
  assets: Assets;
  liabilities: Liabilities;
  goals: Goal[];
  riskTolerance: RiskTolerance;
  simulationResults: SimulationResults | null;
}
```

From src/lib/persistence.ts:
```typescript
export async function readPlan(): Promise<FinancialPlan>;
export async function writePlan(plan: FinancialPlan): Promise<FinancialPlan>;
```

From src/hooks/usePlan.ts:
```typescript
export function usePlan(): {
  plan: FinancialPlan | null;
  isLoading: boolean;
  error: string | null;
  updatePlan: (patch: DeepPartial<FinancialPlan>) => Promise<void>;
};
```

From src/components/Sidebar.tsx:
```typescript
const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Interview', href: '/interview' },
  { label: 'Simulation', href: '/simulation' },
];
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Supabase, update types/defaults, rewrite persistence layer</name>
  <files>
    package.json
    src/lib/supabase.ts
    src/lib/types.ts
    src/lib/planDefaults.ts
    src/lib/generatePlanId.ts
    src/lib/persistence.ts
    src/lib/__tests__/persistence.test.ts
  </files>
  <action>
1. Run `npm install @supabase/supabase-js` in the project root.

2. Create `src/lib/supabase.ts` — Supabase client singleton:
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

3. Update `src/lib/types.ts` — Add two fields to `PlanMetadata`:
```ts
export interface PlanMetadata {
  planId: string;          // NEW
  preparerName: string;    // NEW
  createdAt: string;
  updatedAt: string;
  version: number;
  wizardStep?: number;
}
```

4. Update `src/lib/planDefaults.ts` — Add defaults to `createEmptyPlan()`:
```ts
metadata: {
  planId: '',
  preparerName: '',
  createdAt: now,
  updatedAt: now,
  version: 1,
  wizardStep: 0,
},
```

5. Create `src/lib/generatePlanId.ts`:
```ts
export function generatePlanId(name: string): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return name.trim().replace(/\s+/g, '') + mm + dd + yyyy;
}
```

6. Rewrite `src/lib/persistence.ts` — Replace fs-based read/write with Supabase:
- Remove all `fs` and `path` imports.
- Import `supabase` from `./supabase` and `createEmptyPlan` from `./planDefaults`.
- `readPlan(planId: string): Promise<FinancialPlan>`:
  - If `!planId` (empty string), return `createEmptyPlan()`.
  - Query: `supabase.from('plans').select('data').eq('id', planId).single()`.
  - If error or no data, return `createEmptyPlan()`.
  - Otherwise, back-fill defaults: `const defaults = createEmptyPlan(); return { ...defaults, ...data.data } as FinancialPlan;`
- `writePlan(plan: FinancialPlan): Promise<FinancialPlan>`:
  - Build `updated` with incremented version and new updatedAt (same pattern as current).
  - Upsert: `supabase.from('plans').upsert({ id: updated.metadata.planId, data: updated, updated_at: new Date().toISOString() })`.
  - If error, throw.
  - Return `updated`.

7. Rewrite `src/lib/__tests__/persistence.test.ts` — Replace fs-based tests with Supabase-mocked tests:
- Mock `../supabase` module with `vi.mock`:
  ```ts
  vi.mock('../supabase', () => ({
    supabase: {
      from: vi.fn()
    }
  }));
  ```
- Import `supabase` from `../supabase` and cast to mock.
- For `readPlan` tests:
  - Test: empty planId returns createEmptyPlan().
  - Test: valid planId returns data from Supabase (mock `.from('plans').select('data').eq('id', planId).single()` chain to return `{ data: { data: somePlan }, error: null }`).
  - Test: Supabase error returns createEmptyPlan().
- For `writePlan` tests:
  - Test: increments version and updates updatedAt.
  - Test: calls supabase upsert with correct shape.
  - Test: throws on Supabase error.
- Each mock chain method (`.from()`, `.select()`, `.eq()`, `.single()`, `.upsert()`) should return an object with the next method, ending in the resolved value.
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx vitest run src/lib/__tests__/persistence.test.ts --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>
    - @supabase/supabase-js installed in package.json
    - supabase.ts client singleton exists
    - PlanMetadata has planId and preparerName fields
    - planDefaults includes planId: '' and preparerName: ''
    - generatePlanId helper exists and generates name+mmddyyyy format
    - persistence.ts uses Supabase (no fs imports)
    - persistence tests pass with mocked Supabase
  </done>
</task>

<task type="auto">
  <name>Task 2: Update API routes and create /api/plan/create endpoint</name>
  <files>
    src/app/api/plan/route.ts
    src/app/api/plan/create/route.ts
    src/app/api/simulate/route.ts
  </files>
  <action>
1. Update `src/app/api/plan/route.ts`:
- `GET`: Read `planId` from `request.nextUrl.searchParams.get('planId') ?? ''`. Change the function signature to `GET(request: NextRequest)` (import `NextRequest` from `next/server`). Pass `planId` to `readPlan(planId)`.
- `PUT`: Extract body, get `planId` from `body.metadata?.planId`. Pass full body to `writePlan(body)` (writePlan already reads planId from plan.metadata.planId).

2. Create `src/app/api/plan/create/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { createEmptyPlan } from '@/lib/planDefaults';
import { generatePlanId } from '@/lib/generatePlanId';
import { writePlan } from '@/lib/persistence';

export async function POST(request: Request) {
  try {
    const { preparerName } = await request.json();
    if (!preparerName || typeof preparerName !== 'string' || !preparerName.trim()) {
      return NextResponse.json({ error: 'preparerName is required' }, { status: 400 });
    }
    const planId = generatePlanId(preparerName);
    const plan = createEmptyPlan();
    plan.metadata.planId = planId;
    plan.metadata.preparerName = preparerName.trim();
    const saved = await writePlan(plan);
    return NextResponse.json({ planId: saved.metadata.planId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error creating plan';
    console.error('[POST /api/plan/create]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

3. Update `src/app/api/simulate/route.ts`:
- Read `planId` from request body: `const planId: string = body?.planId ?? ''`.
- Pass to `readPlan(planId)` instead of `readPlan()`.
- When saving (!isWhatIf), pass `planId` through: the plan already has `metadata.planId` from the read, so `writePlan({ ...plan, simulationResults: results })` still works since plan.metadata.planId is populated from the read.
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - GET /api/plan accepts ?planId= query param and passes to readPlan
    - PUT /api/plan passes body to writePlan (planId comes from body.metadata.planId)
    - POST /api/plan/create generates planId, creates empty plan in Supabase, returns { planId }
    - POST /api/simulate reads planId from body and passes to readPlan
    - All routes type-check cleanly
  </done>
</task>

<task type="auto">
  <name>Task 3: Preparer entry screen, planId threading through pages and sidebar</name>
  <files>
    src/app/page.tsx
    src/hooks/usePlan.ts
    src/app/interview/page.tsx
    src/app/simulation/page.tsx
    src/components/Sidebar.tsx
  </files>
  <action>
1. Rewrite `src/app/page.tsx` — Replace dashboard with preparer entry screen:
- Keep 'use client' directive.
- Remove usePlan import (no longer needed on home page).
- Import `useState` from React, `useRouter` from `next/navigation`.
- Render a centered card with:
  - "Financial Planner" heading (text-2xl font-bold text-blue-700).
  - "Preparer Name" text input (controlled state).
  - "Start Plan" button: on click, POST to `/api/plan/create` with `{ preparerName }`, get back `{ planId }`, redirect to `/interview?planId={planId}`.
  - Divider or spacing.
  - "Continue Existing Plan" section: text input for planId + "Load Plan" button that redirects to `/interview?planId={enteredPlanId}`.
- Disable Start Plan button while preparerName is empty. Disable Load Plan while planId input is empty.
- Show loading state on buttons during fetch.

2. Update `src/hooks/usePlan.ts`:
- Add `useSearchParams` from `next/navigation`.
- Read `planId` from `useSearchParams().get('planId') ?? ''`.
- Pass `planId` to GET fetch: `fetch('/api/plan?planId=' + encodeURIComponent(planId))`.
- Include `planId` in the dependency array of the useEffect.
- If `!planId` (empty), set `isLoading = false` and `plan = null` immediately (don't fetch). The page component handles redirect.
- In `updatePlan`, the merged plan already has `metadata.planId` from the loaded plan, so the PUT body naturally includes it.
- Export `planId` from the hook return: add `planId: string` to `UsePlanResult` and return it.

3. Update `src/app/interview/page.tsx`:
- Destructure `planId` from `usePlan()` (newly exported).
- Import `useRouter` (already imported).
- If `!planId` and `!isLoading`, redirect to `/` using `router.push('/')` in a useEffect.
- In `handleFinish`, change `router.push('/simulation')` to `router.push('/simulation?planId=' + encodeURIComponent(planId))`.

4. Update `src/app/simulation/page.tsx`:
- Import `useSearchParams` from `next/navigation`.
- Read `planId` from `useSearchParams().get('planId') ?? ''`.
- Pass `planId` to plan fetch: `fetch('/api/plan?planId=' + encodeURIComponent(planId))`.
- Include `planId` in simulate POST body: add `planId` field to the JSON body for both initial simulation and what-if calls.

5. Update `src/components/Sidebar.tsx`:
- Import `useSearchParams` from `next/navigation`.
- Read `planId` from `useSearchParams().get('planId') ?? ''`.
- Append `?planId={planId}` to nav item hrefs when planId is non-empty:
  ```ts
  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Interview', href: '/interview' },
    { label: 'Simulation', href: '/simulation' },
  ].map(item => ({
    ...item,
    href: planId && item.href !== '/' ? `${item.href}?planId=${planId}` : item.href,
  }));
  ```
  </action>
  <verify>
    <automated>cd /home/john/Projects/MonteCarloFinancialPlanning && npx tsc --noEmit 2>&1 | head -30 && npx vitest run --reporter=verbose 2>&1 | tail -40</automated>
  </verify>
  <done>
    - Home page shows preparer entry screen with Start Plan and Continue Existing Plan
    - usePlan reads planId from URL search params and passes to API
    - Interview page redirects to / if no planId, passes planId to simulation on finish
    - Simulation page reads planId from URL and includes in API calls
    - Sidebar appends ?planId= to Interview and Simulation links when planId is known
    - All TypeScript compiles, all tests pass
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero type errors
2. `npx vitest run` — all tests pass (persistence tests use mocked Supabase)
3. Manual flow: visit localhost:3001, enter preparer name, click Start Plan, verify redirect to /interview?planId=..., complete interview, verify redirect to /simulation?planId=..., verify plan data persists in Supabase `plans` table
</verification>

<success_criteria>
- Supabase client configured and persistence layer uses it (no fs operations)
- PlanMetadata includes planId and preparerName
- Home page is a preparer entry screen (not a dashboard)
- planId flows through URL search params on all pages
- API routes accept and use planId
- All existing tests updated and passing
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260330-pit-migrate-plan-storage-to-supabase-with-pr/260330-pit-SUMMARY.md`
</output>
