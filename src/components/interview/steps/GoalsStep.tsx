'use client';

import { useState } from 'react';
import type { FinancialPlan, Goal, GoalType } from '@/lib/types';
import { RetirementGoalForm } from '@/components/interview/goals/RetirementGoalForm';
import { PurchaseGoalForm } from '@/components/interview/goals/PurchaseGoalForm';
import { EducationGoalForm } from '@/components/interview/goals/EducationGoalForm';
import { LegacyGoalForm } from '@/components/interview/goals/LegacyGoalForm';

// Utility type for recursive partial — allows partial nested updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface GoalsStepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: () => void;
  updatePlan: (patch: DeepPartial<FinancialPlan>) => Promise<void>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGoalSummary(goal: Goal): string {
  switch (goal.type) {
    case 'retirement':
      return `Retire at ${goal.targetRetirementAge} with ${formatCurrency(goal.desiredAnnualIncome)}/yr`;
    case 'purchase':
      return `${goal.description} - ${formatCurrency(goal.targetAmount)} by ${goal.targetYear}`;
    case 'education':
      return `${goal.beneficiary} - ${formatCurrency(goal.targetAmount)} by ${goal.targetYear}`;
    case 'legacy':
      return `${goal.description} - ${formatCurrency(goal.targetAmount)}`;
  }
}

function getGoalDetails(goal: Goal): string {
  switch (goal.type) {
    case 'retirement':
      return `${goal.yearsInRetirement} years in retirement`;
    case 'purchase':
      return 'Purchase goal';
    case 'education':
      return 'Education goal';
    case 'legacy':
      return 'Legacy / estate goal';
  }
}

export function GoalsStep({ plan, onComplete, onBack, updatePlan }: GoalsStepProps) {
  const [activeTab, setActiveTab] = useState<GoalType>('retirement');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);

  const tabLabels: Record<GoalType, string> = {
    retirement: 'Retirement',
    purchase: 'Purchases',
    education: 'Education',
    legacy: 'Legacy',
  };

  const handleTabChange = (tab: GoalType) => {
    setActiveTab(tab);
    setEditingIndex(null);
    setIsAdding(false);
    setConfirmRemoveIndex(null);
  };

  const goalsForTab = plan.goals
    .map((g, i) => ({ goal: g, globalIndex: i }))
    .filter(({ goal }) => goal.type === activeTab);

  const handleRemoveClick = (globalIndex: number) => {
    setConfirmRemoveIndex(globalIndex);
  };

  const handleConfirmRemove = async (globalIndex: number) => {
    const updated = plan.goals.filter((_, i) => i !== globalIndex);
    await updatePlan({ goals: updated });
    setConfirmRemoveIndex(null);
    // If editing the removed goal, close editor
    if (editingIndex === globalIndex) {
      setEditingIndex(null);
    }
  };

  const handleCancelRemove = () => {
    setConfirmRemoveIndex(null);
  };

  const handleSaveGoal = async (goal: Goal) => {
    const updated = [...plan.goals, goal];
    await updatePlan({ goals: updated });
    setIsAdding(false);
  };

  const handleUpdateGoal = async (goal: Goal, globalIndex: number) => {
    const updated = plan.goals.map((g, i) => (i === globalIndex ? goal : g));
    await updatePlan({ goals: updated });
    setEditingIndex(null);
  };

  const handleNext = async () => {
    await onComplete({ goals: plan.goals });
  };

  const renderGoalForm = (onSave: (goal: Goal) => Promise<void>, initialGoal?: Goal) => {
    const formProps = {
      onCancel: () => {
        setIsAdding(false);
        setEditingIndex(null);
      },
    };

    switch (activeTab) {
      case 'retirement':
        return (
          <RetirementGoalForm
            initialData={initialGoal?.type === 'retirement' ? initialGoal : undefined}
            onSave={onSave}
            {...formProps}
          />
        );
      case 'purchase':
        return (
          <PurchaseGoalForm
            initialData={initialGoal?.type === 'purchase' ? initialGoal : undefined}
            onSave={onSave}
            {...formProps}
          />
        );
      case 'education':
        return (
          <EducationGoalForm
            initialData={initialGoal?.type === 'education' ? initialGoal : undefined}
            onSave={onSave}
            {...formProps}
          />
        );
      case 'legacy':
        return (
          <LegacyGoalForm
            initialData={initialGoal?.type === 'legacy' ? initialGoal : undefined}
            onSave={onSave}
            {...formProps}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['retirement', 'purchase', 'education', 'legacy'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Goal list */}
      <div className="space-y-3">
        {goalsForTab.length === 0 && !isAdding ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-gray-700">No goals added yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Add at least one financial goal to continue. You can add retirement, purchase,
              education, or legacy goals.
            </p>
          </div>
        ) : (
          goalsForTab.map(({ goal, globalIndex }) => (
            <div key={globalIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {editingIndex === globalIndex ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  {renderGoalForm(
                    (g) => handleUpdateGoal(g, globalIndex),
                    goal
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getGoalSummary(goal)}</p>
                      <p className="text-sm text-gray-500">{getGoalDetails(goal)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(globalIndex);
                          setIsAdding(false);
                          setConfirmRemoveIndex(null);
                        }}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveClick(globalIndex)}
                        className="text-sm font-normal text-red-600 hover:text-red-700 focus:outline-none focus:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {confirmRemoveIndex === globalIndex && (
                    <div role="alertdialog" className="mt-2 flex items-center gap-3 text-sm">
                      <span className="text-gray-700">Are you sure? This will remove the goal.</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmRemove(globalIndex)}
                        className="font-semibold text-red-600 hover:text-red-700"
                      >
                        Yes, remove
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRemove}
                        className="font-semibold text-gray-600 hover:text-gray-700"
                      >
                        Keep it
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}

        {/* Inline add form */}
        {isAdding && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            {renderGoalForm(handleSaveGoal)}
          </div>
        )}

        {/* Add Goal button */}
        {!isAdding && editingIndex === null && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setConfirmRemoveIndex(null);
            }}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            + Add Goal
          </button>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}
