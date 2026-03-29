// src/app/simulation/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SimulationResults, FinancialPlan } from '@/lib/types';
import type { SimulationOverrides } from '@/lib/simulation';
import { SimulationSkeleton } from '@/components/simulation/SimulationSkeleton';
import { WhatIfPanel } from '@/components/simulation/WhatIfPanel';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatGoalType(type: string): string {
  switch (type) {
    case 'retirement': return 'Retirement';
    case 'purchase': return 'Major Purchase';
    case 'education': return 'Education';
    case 'legacy': return 'Legacy / Estate';
    default: return type;
  }
}

export default function SimulationPage() {
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runInitialSimulation() {
      try {
        // First, fetch the plan
        const planRes = await fetch('/api/plan');
        if (!planRes.ok) throw new Error(`Failed to fetch plan: ${planRes.statusText}`);
        const planData: FinancialPlan = await planRes.json();
        if (!cancelled) setPlan(planData);

        // Fire initial simulation — this run is persisted (isWhatIf: false)
        const simRes = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isWhatIf: false }),
        });
        if (!simRes.ok) throw new Error(`Simulation failed: ${simRes.statusText}`);
        const simData: SimulationResults = await simRes.json();
        if (!cancelled) {
          setResults(simData);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    }

    runInitialSimulation();
    return () => { cancelled = true; };
  }, []);

  const handleWhatIf = useCallback(async (overrides: SimulationOverrides) => {
    setIsLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides, isWhatIf: true }),
      });
      if (!res.ok) throw new Error(`What-if simulation failed: ${res.statusText}`);
      const data: SimulationResults = await res.json();
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monte Carlo Simulation Results</h1>
        <p className="mt-1 text-sm text-gray-500">
          Based on {results ? results.runCount.toLocaleString() : '10,000'} simulated scenarios
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      {isLoading && !results && <SimulationSkeleton />}

      {results && (
        <>
          {/* Overall probability score */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Overall probability of success</p>
            <p className="text-5xl font-bold text-gray-900">
              {Math.round(results.overallProbability * 100)}%
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Ran at {new Date(results.ranAt).toLocaleString()}
            </p>
          </div>

          {/* Per-goal breakdown */}
          {results.goalResults.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Goal Breakdown</h2>
              <div className="space-y-3">
                {results.goalResults.map((goal) => (
                  <div
                    key={goal.goalIndex}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatGoalType(goal.goalType)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Target: {formatCurrency(goal.targetAmount)}
                        {goal.fundingGap > 0 && (
                          <span className="ml-2 text-amber-600">
                            Gap: {formatCurrency(goal.fundingGap)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          goal.probabilityScore >= 0.8
                            ? 'text-green-600'
                            : goal.probabilityScore >= 0.5
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.round(goal.probabilityScore * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* What-if panel — always rendered once plan is loaded */}
      {plan && (
        <WhatIfPanel
          plan={plan}
          onRunSimulation={handleWhatIf}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
