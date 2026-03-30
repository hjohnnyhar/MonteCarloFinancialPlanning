// src/lib/persistence.ts
import { supabase } from './supabase';
import type { FinancialPlan } from './types';
import { createEmptyPlan } from './planDefaults';

export async function readPlan(planId: string): Promise<FinancialPlan> {
  if (!planId) {
    return createEmptyPlan();
  }

  const { data, error } = await supabase
    .from('plans')
    .select('data')
    .eq('id', planId)
    .single();

  if (error || !data) {
    return createEmptyPlan();
  }

  const defaults = createEmptyPlan();
  return { ...defaults, ...data.data } as FinancialPlan;
}

export async function writePlan(plan: FinancialPlan): Promise<FinancialPlan> {
  const updated: FinancialPlan = {
    ...plan,
    metadata: {
      ...plan.metadata,
      updatedAt: new Date().toISOString(),
      version: plan.metadata.version + 1,
    },
  };

  const { error } = await supabase
    .from('plans')
    .upsert({
      id: updated.metadata.planId,
      data: updated,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to save plan: ${error.message}`);
  }

  return updated;
}
