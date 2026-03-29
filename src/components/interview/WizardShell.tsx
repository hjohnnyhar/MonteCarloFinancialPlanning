import React from 'react';

interface WizardShellProps {
  currentIndex: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  children: React.ReactNode;
}

export function WizardShell({
  currentIndex,
  totalSteps,
  stepTitle,
  stepDescription,
  children,
}: WizardShellProps) {
  const stepNumber = currentIndex + 1;
  const percent = Math.round((stepNumber / totalSteps) * 100);

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-white">
      {/* Progress bar strip */}
      <div className="w-full border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-sm text-gray-500">
          Step {stepNumber} of {totalSteps}
        </span>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Inner content container */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-semibold leading-tight text-gray-900">{stepTitle}</h1>
        <p className="mt-1 text-base text-gray-500">{stepDescription}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
