// src/components/simulation/WhatIfPanel.tsx
'use client';

import { useState } from 'react';
import { RETURN_ASSUMPTIONS, type SimulationOverrides } from '@/lib/simulation';
import type { FinancialPlan, RiskToleranceLevel } from '@/lib/types';

interface WhatIfPanelProps {
  plan: FinancialPlan;
  onRunSimulation: (overrides: SimulationOverrides) => void;
  isLoading: boolean;
}

export function WhatIfPanel({ plan, onRunSimulation, isLoading }: WhatIfPanelProps) {
  const defaultRetirementAge = (() => {
    const retirementGoal = plan.goals.find((g) => g.type === 'retirement');
    return retirementGoal?.type === 'retirement' ? retirementGoal.targetRetirementAge : 65;
  })();

  const defaultRiskLevel: RiskToleranceLevel = plan.riskTolerance.level ?? 'moderate';

  const [savingsRate, setSavingsRate] = useState(
    Math.round(plan.income.annualSavingsRate * 100)
  );
  const [retirementAge, setRetirementAge] = useState(defaultRetirementAge);
  const [riskLevel, setRiskLevel] = useState<RiskToleranceLevel>(defaultRiskLevel);

  const hasRetirementGoal = plan.goals.some((g) => g.type === 'retirement');

  const handleRun = () => {
    const { mean, stdDev } = RETURN_ASSUMPTIONS[riskLevel];
    onRunSimulation({
      annualSavingsRate: savingsRate / 100,
      retirementAge: hasRetirementGoal ? retirementAge : undefined,
      returnMean: mean,
      returnStdDev: stdDev,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">What-If Analysis</h2>
      <div className="space-y-4">

        <div>
          <label htmlFor="savings-rate" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Savings Rate (%)
          </label>
          <input
            id="savings-rate"
            type="number"
            min={0}
            max={100}
            step={1}
            value={savingsRate}
            onChange={(e) => setSavingsRate(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {hasRetirementGoal && (
          <div>
            <label htmlFor="retirement-age" className="block text-sm font-medium text-gray-700 mb-1">
              Retirement Age
            </label>
            <input
              id="retirement-age"
              type="number"
              min={40}
              max={80}
              step={1}
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="risk-level" className="block text-sm font-medium text-gray-700 mb-1">
            Risk Level
          </label>
          <select
            id="risk-level"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as RiskToleranceLevel)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <button
          onClick={handleRun}
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Running...' : 'Run What-If'}
        </button>
      </div>
    </div>
  );
}
