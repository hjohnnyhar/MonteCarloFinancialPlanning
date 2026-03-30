// src/app/api/plan/create/route.ts
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
