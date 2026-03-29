// src/components/simulation/RecommendationsCard.tsx
'use client';

import type { Recommendation } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

function leverLabel(lever: Recommendation['lever']): string {
  switch (lever) {
    case 'savings_increase': return 'Savings rate';
    case 'retirement_delay': return 'Retirement age';
    case 'spending_reduction': return 'Monthly spending';
    case 'goal_reduction': return 'Goal amount';
    default: return lever;
  }
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Recommendations</h2>
      <ol className="space-y-4">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex-shrink-0 text-sm font-semibold text-gray-400 w-5">
              {index + 1}.
            </span>
            <div>
              <p className="text-sm text-gray-800">{rec.summary}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{leverLabel(rec.lever)}</span>
                {': '}
                {formatCurrency(rec.currentValue)} &rarr; {formatCurrency(rec.suggestedValue)}
                {' '}
                <span className="text-green-600 font-medium">
                  ({Math.round(rec.projectedScore * 100)}% projected)
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
