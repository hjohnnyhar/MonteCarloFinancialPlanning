// src/lib/persistence.ts
import fs from 'fs';
import path from 'path';
import type { FinancialPlan } from './types';
import { createEmptyPlan } from './planDefaults';

const DATA_DIR = () => path.join(process.cwd(), 'data');
const PLAN_FILE = () => path.join(DATA_DIR(), 'plan.json');

export async function readPlan(): Promise<FinancialPlan> {
  const planFile = PLAN_FILE();
  try {
    const raw = await fs.promises.readFile(planFile, 'utf-8');
    try {
      const parsed = JSON.parse(raw) as FinancialPlan;
      // Back-fill fields added after initial plan creation so old plans don't crash.
      const defaults = createEmptyPlan();
      return { ...defaults, ...parsed };
    } catch {
      throw new Error('Plan file is corrupt: could not parse JSON from ' + planFile);
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      // File does not exist — return a fresh empty plan
      return createEmptyPlan();
    }
    throw err;
  }
}

export async function writePlan(plan: FinancialPlan): Promise<FinancialPlan> {
  const dataDir = DATA_DIR();
  const planFile = PLAN_FILE();

  const updated: FinancialPlan = {
    ...plan,
    metadata: {
      ...plan.metadata,
      updatedAt: new Date().toISOString(),
      version: plan.metadata.version + 1,
    },
  };

  await fs.promises.mkdir(dataDir, { recursive: true });
  await fs.promises.writeFile(planFile, JSON.stringify(updated, null, 2), 'utf-8');

  return updated;
}
