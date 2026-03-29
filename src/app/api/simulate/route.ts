// src/app/api/simulate/route.ts
import { NextResponse } from 'next/server';
import { readPlan, writePlan } from '@/lib/persistence';
import { runSimulation, type SimulationOverrides } from '@/lib/simulation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const overrides: SimulationOverrides = body?.overrides ?? {};
    const isWhatIf: boolean = body?.isWhatIf ?? false;

    const plan = await readPlan();
    const results = runSimulation(plan, overrides);

    if (!isWhatIf) {
      await writePlan({ ...plan, simulationResults: results });
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error running simulation';
    console.error('[POST /api/simulate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
