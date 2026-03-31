// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanSummary } from '@/app/api/plans/route';

export default function HomePage() {
  const router = useRouter();
  const [preparerName, setPreparerName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing plans dropdown
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPlans(data))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = plans.filter((p) =>
    p.preparerName.toLowerCase().includes(search.toLowerCase()) ||
    p.planId.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!selectedPlan) return;
    setIsLoading(true);
    router.push(`/interview?planId=${encodeURIComponent(selectedPlan.planId)}`);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex items-start justify-center p-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Financial Planner</h1>
          <p className="mt-2 text-sm text-gray-500">
            Start a new plan or continue an existing one.
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
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Plans
              </label>
              <input
                type="text"
                value={selectedPlan ? `${selectedPlan.preparerName} — ${selectedPlan.planId}` : search}
                onChange={(e) => {
                  setSelectedPlan(null);
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (!selectedPlan) setShowDropdown(true);
                }}
                onClick={() => {
                  if (selectedPlan) {
                    setSelectedPlan(null);
                    setSearch('');
                    setShowDropdown(true);
                  }
                }}
                placeholder={plans.length === 0 ? 'No saved plans found' : 'Type to search...'}
                disabled={plans.length === 0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              {showDropdown && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
                  {filtered.map((p) => (
                    <li
                      key={p.planId}
                      onMouseDown={() => {
                        setSelectedPlan(p);
                        setSearch('');
                        setShowDropdown(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                    >
                      <span className="font-medium text-gray-900">{p.preparerName}</span>
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatDate(p.updatedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={handleLoadPlan}
              disabled={!selectedPlan || isLoading}
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
