// src/app/page.tsx
'use client';

import Link from 'next/link';
import { usePlan } from '@/hooks/usePlan';

export default function DashboardPage() {
  const { plan, isLoading, error } = usePlan();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Financial Plan Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Complete the interview to generate your Monte Carlo probability score.
      </p>

      {isLoading && (
        <div className="mt-6 text-sm text-gray-400">Loading plan...</div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      {plan && !isLoading && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Plan version</dt>
              <dd className="font-medium text-gray-900">{plan.metadata.version}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last updated</dt>
              <dd className="font-medium text-gray-900">
                {new Date(plan.metadata.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Goals defined</dt>
              <dd className="font-medium text-gray-900">{plan.goals.length}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Simulation</dt>
              <dd className="font-medium text-gray-900">
                {plan.simulationResults
                  ? `${Math.round(plan.simulationResults.overallProbability * 100)}%`
                  : 'Not run'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/interview"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Interview
        </Link>
      </div>
    </div>
  );
}
