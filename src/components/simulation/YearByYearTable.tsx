// src/components/simulation/YearByYearTable.tsx
'use client';

import { useState } from 'react';
import type { YearlySnapshot } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface YearByYearTableProps {
  projection: YearlySnapshot[];
  planCurrentAge: number;
}

export function YearByYearTable({ projection }: YearByYearTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (!projection || projection.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between w-full text-base font-semibold text-gray-900"
      >
        <span>View year-by-year projection</span>
        <span aria-hidden="true">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500">
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">Age</th>
                <th className="pb-2 pr-4">Portfolio Value</th>
                <th className="pb-2 pr-4">Income</th>
                <th className="pb-2 pr-4">Savings</th>
                <th className="pb-2 pr-4">Withdrawals</th>
                <th className="pb-2">Milestone</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((row) => (
                <tr
                  key={row.year}
                  className={`border-b border-gray-100 last:border-0 ${
                    row.goalMilestone ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-1.5 pr-4 tabular-nums">{row.year}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{row.age}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{formatCurrency(row.portfolioValue)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{formatCurrency(row.householdIncome)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{formatCurrency(row.annualSavings)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{formatCurrency(row.annualWithdrawal)}</td>
                  <td className="py-1.5 text-gray-500">{row.goalMilestone ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
