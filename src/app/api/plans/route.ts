// src/app/api/plans/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface PlanSummary {
  planId: string;
  preparerName: string;
  updatedAt: string;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id, updated_at, data')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    const plans: PlanSummary[] = (data ?? []).map((row) => ({
      planId: row.id,
      preparerName: row.data?.metadata?.preparerName ?? row.id,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(plans);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GET /api/plans]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
