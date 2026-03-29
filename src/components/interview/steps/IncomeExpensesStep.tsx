'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { incomeExpensesSchema, type IncomeExpensesFormData } from '@/lib/wizardSchemas';
import type { FinancialPlan } from '@/lib/types';

interface StepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: (() => void) | null;
}

export function IncomeExpensesStep({ plan, onComplete, onBack }: StepProps) {
  const {
    register,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm<IncomeExpensesFormData>({
    resolver: zodResolver(incomeExpensesSchema),
    defaultValues: {
      income: { salary: 0, otherAnnualIncome: 0, annualSavingsRate: 0 },
      expenses: { monthlyEssential: 0, monthlyDiscretionary: 0, monthlyDebtPayments: 0 },
    },
  });

  // Reset when plan loads (Pitfall 2 fix)
  useEffect(() => {
    if (plan) {
      reset({ income: plan.income, expenses: plan.expenses });
    }
  }, [plan, reset]);

  // D-04 warn-but-allow: show validation warnings but never block advancement
  const handleNext = async () => {
    await trigger(); // Display validation warnings
    const values = getValues();
    await onComplete({ income: values.income, expenses: values.expenses });
  };

  return (
    <div className="space-y-8">
      {/* Income section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-tight text-gray-900">Income</h2>

        {/* Annual Salary */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="income.salary"
            className="block text-sm font-normal text-gray-700"
          >
            Annual Salary
          </label>
          <input
            id="income.salary"
            type="text"
            inputMode="decimal"
            {...register('income.salary')}
            aria-invalid={!!errors.income?.salary}
            aria-describedby={errors.income?.salary ? 'income-salary-error' : undefined}
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.income?.salary
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.income?.salary && (
            <p id="income-salary-error" className="text-sm text-red-600" role="alert">
              {errors.income.salary.message}
            </p>
          )}
        </div>

        {/* Other Annual Income */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="income.otherAnnualIncome"
            className="block text-sm font-normal text-gray-700"
          >
            Other Annual Income
          </label>
          <input
            id="income.otherAnnualIncome"
            type="text"
            inputMode="decimal"
            {...register('income.otherAnnualIncome')}
            aria-invalid={!!errors.income?.otherAnnualIncome}
            aria-describedby={
              errors.income?.otherAnnualIncome ? 'income-otherAnnualIncome-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.income?.otherAnnualIncome
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.income?.otherAnnualIncome && (
            <p
              id="income-otherAnnualIncome-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.income.otherAnnualIncome.message}
            </p>
          )}
        </div>

        {/* Annual Savings Rate */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="income.annualSavingsRate"
            className="block text-sm font-normal text-gray-700"
          >
            Annual Savings Rate (0-1)
          </label>
          <p className="text-sm text-gray-500">Enter as decimal, e.g. 0.15 for 15%</p>
          <input
            id="income.annualSavingsRate"
            type="text"
            inputMode="decimal"
            {...register('income.annualSavingsRate')}
            aria-invalid={!!errors.income?.annualSavingsRate}
            aria-describedby={
              errors.income?.annualSavingsRate ? 'income-annualSavingsRate-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.income?.annualSavingsRate
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.income?.annualSavingsRate && (
            <p
              id="income-annualSavingsRate-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.income.annualSavingsRate.message}
            </p>
          )}
        </div>
      </div>

      {/* Monthly Expenses section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-tight text-gray-900">Monthly Expenses</h2>

        {/* Monthly Essential Expenses */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="expenses.monthlyEssential"
            className="block text-sm font-normal text-gray-700"
          >
            Monthly Essential Expenses
          </label>
          <p className="text-sm text-gray-500">Rent, utilities, food</p>
          <input
            id="expenses.monthlyEssential"
            type="text"
            inputMode="decimal"
            {...register('expenses.monthlyEssential')}
            aria-invalid={!!errors.expenses?.monthlyEssential}
            aria-describedby={
              errors.expenses?.monthlyEssential ? 'expenses-monthlyEssential-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.expenses?.monthlyEssential
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.expenses?.monthlyEssential && (
            <p
              id="expenses-monthlyEssential-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.expenses.monthlyEssential.message}
            </p>
          )}
        </div>

        {/* Monthly Discretionary */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="expenses.monthlyDiscretionary"
            className="block text-sm font-normal text-gray-700"
          >
            Monthly Discretionary
          </label>
          <p className="text-sm text-gray-500">Dining, entertainment</p>
          <input
            id="expenses.monthlyDiscretionary"
            type="text"
            inputMode="decimal"
            {...register('expenses.monthlyDiscretionary')}
            aria-invalid={!!errors.expenses?.monthlyDiscretionary}
            aria-describedby={
              errors.expenses?.monthlyDiscretionary
                ? 'expenses-monthlyDiscretionary-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.expenses?.monthlyDiscretionary
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.expenses?.monthlyDiscretionary && (
            <p
              id="expenses-monthlyDiscretionary-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.expenses.monthlyDiscretionary.message}
            </p>
          )}
        </div>

        {/* Monthly Debt Payments */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="expenses.monthlyDebtPayments"
            className="block text-sm font-normal text-gray-700"
          >
            Monthly Debt Payments
          </label>
          <input
            id="expenses.monthlyDebtPayments"
            type="text"
            inputMode="decimal"
            {...register('expenses.monthlyDebtPayments')}
            aria-invalid={!!errors.expenses?.monthlyDebtPayments}
            aria-describedby={
              errors.expenses?.monthlyDebtPayments
                ? 'expenses-monthlyDebtPayments-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.expenses?.monthlyDebtPayments
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.expenses?.monthlyDebtPayments && (
            <p
              id="expenses-monthlyDebtPayments-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.expenses.monthlyDebtPayments.message}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons — owned by this step */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back
          </button>
        ) : (
          <div />
        )}
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
