// src/hooks/usePlan.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FinancialPlan } from '@/lib/types';

interface UsePlanResult {
  plan: FinancialPlan | null;
  isLoading: boolean;
  error: string | null;
  updatePlan: (patch: DeepPartial<FinancialPlan>) => Promise<void>;
}

// Utility type for recursive partial — allows partial nested updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const patchVal = patch[key as keyof DeepPartial<T>];
    const baseVal = base[key];
    if (
      patchVal !== null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal, patchVal as DeepPartial<typeof baseVal>);
    } else if (patchVal !== undefined) {
      result[key] = patchVal as T[keyof T];
    }
  }
  return result;
}

export function usePlan(): UsePlanResult {
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/plan')
      .then((res) => res.json())
      .then((data: FinancialPlan) => {
        setPlan(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load plan';
        setError(msg);
        setIsLoading(false);
      });
  }, []);

  const updatePlan = useCallback(
    async (patch: DeepPartial<FinancialPlan>) => {
      if (!plan) return;
      const merged = deepMerge(plan, patch);
      // Optimistic update
      setPlan(merged);
      try {
        const res = await fetch('/api/plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        });
        if (!res.ok) {
          throw new Error(`Save failed: ${res.status}`);
        }
        const saved: FinancialPlan = await res.json();
        // Update with server-confirmed version (includes updated metadata.version and updatedAt)
        setPlan(saved);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save plan';
        setError(msg);
      }
    },
    [plan]
  );

  return { plan, isLoading, error, updatePlan };
}
