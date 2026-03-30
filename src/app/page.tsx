// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [preparerName, setPreparerName] = useState('');
  const [existingPlanId, setExistingPlanId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPlan = async () => {
    if (!preparerName.trim()) return;
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparerName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed to create plan: ${res.status}`);
      }
      const { planId } = await res.json();
      router.push(`/interview?planId=${encodeURIComponent(planId)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      setIsStarting(false);
    }
  };

  const handleLoadPlan = () => {
    if (!existingPlanId.trim()) return;
    setIsLoading(true);
    router.push(`/interview?planId=${encodeURIComponent(existingPlanId.trim())}`);
  };

  return (
    <div className="flex items-start justify-center p-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Financial Planner</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your name to start a new plan, or load an existing plan by ID.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Start new plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Start a New Plan</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="preparer-name" className="block text-sm font-medium text-gray-700 mb-1">
                Preparer Name
              </label>
              <input
                id="preparer-name"
                type="text"
                value={preparerName}
                onChange={(e) => setPreparerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isStarting && preparerName.trim() && handleStartPlan()}
                placeholder="e.g. John Smith"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleStartPlan}
              disabled={!preparerName.trim() || isStarting}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Creating plan...' : 'Start Plan'}
            </button>
          </div>
        </div>

        {/* Load existing plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Continue Existing Plan</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="plan-id" className="block text-sm font-medium text-gray-700 mb-1">
                Plan ID
              </label>
              <input
                id="plan-id"
                type="text"
                value={existingPlanId}
                onChange={(e) => setExistingPlanId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && existingPlanId.trim() && handleLoadPlan()}
                placeholder="e.g. JohnSmith03302026"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleLoadPlan}
              disabled={!existingPlanId.trim() || isLoading}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Load Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
