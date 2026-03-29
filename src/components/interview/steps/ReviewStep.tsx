'use client';

import type { FinancialPlan, Goal } from '@/lib/types';

interface ReviewStepProps {
  plan: FinancialPlan;
  onComplete: () => Promise<void>;
  goToStep: (index: number) => void;
}

function formatGoalSummary(goal: Goal): string {
  switch (goal.type) {
    case 'retirement':
      return `Retire at ${goal.targetRetirementAge} with $${goal.desiredAnnualIncome.toLocaleString()}/yr`;
    case 'purchase':
      return `${goal.description} - $${goal.targetAmount.toLocaleString()}`;
    case 'education':
      return `${goal.beneficiary} - $${goal.targetAmount.toLocaleString()}`;
    case 'legacy':
      return `${goal.description} - $${goal.targetAmount.toLocaleString()}`;
  }
}

export function ReviewStep({ plan, onComplete, goToStep }: ReviewStepProps) {
  const totalAssets =
    plan.assets.checkingAndSavings +
    plan.assets.retirementAccounts +
    plan.assets.taxableInvestments +
    plan.assets.realEstateEquity +
    plan.assets.otherAssets;

  const totalLiabilities =
    plan.liabilities.mortgageBalance +
    plan.liabilities.studentLoanBalance +
    plan.liabilities.autoLoanBalance +
    plan.liabilities.creditCardBalance +
    plan.liabilities.otherDebt;

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Section 1: Income & Expenses */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Income &amp; Expenses</h3>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-gray-500">Savings Rate</dt>
            <dd className="text-gray-900">
              {(plan.income.annualSavingsRate * 100).toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Monthly Essential</dt>
            <dd className="text-gray-900">
              ${plan.expenses.monthlyEssential.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Monthly Discretionary</dt>
            <dd className="text-gray-900">
              ${plan.expenses.monthlyDiscretionary.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Monthly Debt</dt>
            <dd className="text-gray-900">
              ${plan.expenses.monthlyDebtPayments.toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Section 2: Assets & Liabilities */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Assets &amp; Liabilities</h3>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-gray-500">Checking &amp; Savings</dt>
            <dd className="text-gray-900">
              ${plan.assets.checkingAndSavings.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Retirement Accounts</dt>
            <dd className="text-gray-900">
              ${plan.assets.retirementAccounts.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Taxable Investments</dt>
            <dd className="text-gray-900">
              ${plan.assets.taxableInvestments.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Real Estate Value</dt>
            <dd className="text-gray-900">
              ${plan.assets.realEstateEquity.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Other Assets</dt>
            <dd className="text-gray-900">${plan.assets.otherAssets.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Mortgage Balance</dt>
            <dd className="text-gray-900">
              ${plan.liabilities.mortgageBalance.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Student Loans</dt>
            <dd className="text-gray-900">
              ${plan.liabilities.studentLoanBalance.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Auto Loans</dt>
            <dd className="text-gray-900">
              ${plan.liabilities.autoLoanBalance.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Credit Card</dt>
            <dd className="text-gray-900">
              ${plan.liabilities.creditCardBalance.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Other Debt</dt>
            <dd className="text-gray-900">${plan.liabilities.otherDebt.toLocaleString()}</dd>
          </div>
        </dl>
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-sm font-semibold text-gray-900">
            Net Worth:{' '}
            <span className={netWorth >= 0 ? 'text-green-700' : 'text-red-600'}>
              ${netWorth.toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Section 3: Financial Goals */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Financial Goals</h3>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {plan.goals.length} goal{plan.goals.length !== 1 ? 's' : ''} defined
        </p>
        {plan.goals.length > 0 && (
          <ul className="mt-2 space-y-1">
            {plan.goals.map((goal, i) => (
              <li key={i} className="text-sm text-gray-700">
                <span className="capitalize font-medium">{goal.type}:</span>{' '}
                {formatGoalSummary(goal)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Section 4: Risk Tolerance */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Risk Tolerance</h3>
          <button
            type="button"
            onClick={() => goToStep(4)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-700">
          {plan.riskTolerance.score > 0 && plan.riskTolerance.level
            ? (
              <span className="capitalize">{plan.riskTolerance.level}</span>
            )
            : 'Not completed'}
          {plan.riskTolerance.score > 0 && (
            <span className="text-gray-500"> (score: {plan.riskTolerance.score}/10)</span>
          )}
        </p>
      </div>

      {/* Final CTA */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => goToStep(4)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save &amp; Run Simulation
        </button>
      </div>
    </div>
  );
}
