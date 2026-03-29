'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { wizardStore } from '@/lib/wizardStore';
import { WIZARD_STEPS } from '@/lib/wizardSteps';
import { WizardShell } from '@/components/interview/WizardShell';
import { IncomeExpensesStep } from '@/components/interview/steps/IncomeExpensesStep';
import { AssetsLiabilitiesStep } from '@/components/interview/steps/AssetsLiabilitiesStep';
import { GoalsStep } from '@/components/interview/steps/GoalsStep';
import type { FinancialPlan } from '@/lib/types';

export default function InterviewPage() {
  const { plan, isLoading, updatePlan } = usePlan();
  const [stepIndex, setStepIndex] = useState(0);
  const hasResumed = useRef(false);

  // Listen for Sidebar clicks (bidirectional sync)
  const externalStepIndex = useSyncExternalStore(
    wizardStore.subscribe,
    wizardStore.getStepIndex,
    () => 0
  );

  useEffect(() => {
    setStepIndex(externalStepIndex);
  }, [externalStepIndex]);

  // Resume logic (INT-06): restore saved step on first load
  useEffect(() => {
    if (plan && !hasResumed.current) {
      const saved = plan.metadata.wizardStep ?? 0;
      setStepIndex(saved);
      // Mark all steps before saved as completed
      const completed = Array.from({ length: saved }, (_, i) => i);
      wizardStore.setCompletedSteps(completed);
      hasResumed.current = true;
    }
  }, [plan]);

  // Sync stepIndex to wizardStore so Sidebar picks up wizard state
  useEffect(() => {
    wizardStore.setStepIndex(stepIndex);
  }, [stepIndex]);

  const handleStepComplete = async (stepData: Partial<FinancialPlan>) => {
    const nextIndex = stepIndex + 1;
    await updatePlan({ ...stepData, metadata: { wizardStep: nextIndex } });
    setStepIndex(nextIndex);
    // Update completed steps in wizardStore
    const newCompleted = [...new Set([...wizardStore.getCompletedSteps(), stepIndex])];
    wizardStore.setCompletedSteps(newCompleted);
  };

  const handleBack = () => {
    setStepIndex((s) => Math.max(0, s - 1));
  };

  if (isLoading || !plan) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-400">
        Loading your plan...
      </div>
    );
  }

  const stepConfig = WIZARD_STEPS[stepIndex];

  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <IncomeExpensesStep
            plan={plan}
            onComplete={handleStepComplete}
            onBack={null}
          />
        );
      case 1:
        return (
          <AssetsLiabilitiesStep
            plan={plan}
            onComplete={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <GoalsStep
            plan={plan}
            onComplete={handleStepComplete}
            onBack={handleBack}
            updatePlan={updatePlan}
          />
        );
      case 3:
        return (
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg font-semibold text-gray-700">Risk Tolerance</p>
            <p className="mt-2 text-sm">Coming soon — will be built in Plan 03.</p>
          </div>
        );
      case 4:
        return (
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg font-semibold text-gray-700">Review &amp; Confirm</p>
            <p className="mt-2 text-sm">Coming soon — will be built in Plan 04.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <WizardShell
      currentIndex={stepIndex}
      totalSteps={WIZARD_STEPS.length}
      stepTitle={stepConfig?.title ?? ''}
      stepDescription={stepConfig?.description ?? ''}
    >
      {renderStep()}
    </WizardShell>
  );
}
