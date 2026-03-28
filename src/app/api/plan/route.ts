// src/app/api/plan/route.ts
import { NextResponse } from 'next/server';
import { readPlan, writePlan } from '@/lib/persistence';

export async function GET() {
  try {
    const plan = await readPlan();
    return NextResponse.json(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error reading plan';
    console.error('[GET /api/plan]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const saved = await writePlan(body);
    return NextResponse.json(saved);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error saving plan';
    console.error('[PUT /api/plan]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
