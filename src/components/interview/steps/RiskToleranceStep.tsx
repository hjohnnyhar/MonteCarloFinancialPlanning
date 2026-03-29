'use client';

import { useState } from 'react';
import { RISK_QUESTIONS, scoreFromAnswers, deriveRiskLevel } from '@/lib/riskToleranceQuestions';
import type { FinancialPlan } from '@/lib/types';

interface RiskToleranceStepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: () => void;
}

export function RiskToleranceStep({ plan, onComplete, onBack }: RiskToleranceStepProps) {
  const [answers, setAnswers] = useState<Record<string, number>>(
    plan.riskTolerance.answers || {}
  );

  const allAnswered = RISK_QUESTIONS.every((q) => answers[q.id] !== undefined);
  const score = allAnswered ? scoreFromAnswers(answers) : null;
  const level = score !== null ? deriveRiskLevel(score) : null;

  const handleNext = async () => {
    const finalScore = scoreFromAnswers(answers);
    const finalLevel = deriveRiskLevel(finalScore);
    await onComplete({
      riskTolerance: { answers, score: finalScore, level: finalLevel },
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        {RISK_QUESTIONS.map((question) => (
          <fieldset key={question.id} className="flex flex-col gap-3">
            <legend className="text-sm font-normal text-gray-700">{question.text}</legend>
            {question.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={answers[question.id] === option.value}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: option.value }))
                  }
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-base text-gray-900">{option.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      {/* D-09: Show derived risk level after all questions answered */}
      {allAnswered && level && score !== null && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">
            Based on your answers:{' '}
            <span className="capitalize">{level}</span> risk tolerance
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {level === 'conservative'
              ? 'Focus on capital preservation with lower-risk investments.'
              : level === 'moderate'
                ? 'Balanced mix of stocks and bonds for growth with moderate risk.'
                : 'Growth-focused portfolio accepting higher short-term volatility.'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Score: {score}/10</p>
        </div>
      )}

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
          disabled={!allAnswered}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
