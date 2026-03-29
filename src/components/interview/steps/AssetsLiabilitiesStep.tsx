'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { assetsLiabilitiesSchema, type AssetsLiabilitiesFormData } from '@/lib/wizardSchemas';
import type { FinancialPlan } from '@/lib/types';

interface StepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: (() => void) | null;
}

// zodResolver v5 returns Resolver<unknown> due to z.coerce — cast required
const assetsResolver: Resolver<AssetsLiabilitiesFormData> = zodResolver(assetsLiabilitiesSchema) as unknown as Resolver<AssetsLiabilitiesFormData>;

export function AssetsLiabilitiesStep({ plan, onComplete, onBack }: StepProps) {
  const {
    register,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm<AssetsLiabilitiesFormData>({
    resolver: assetsResolver,
    defaultValues: {
      assets: {
        checkingAndSavings: 0,
        retirementAccounts: 0,
        taxableInvestments: 0,
        realEstateEquity: 0,
        otherAssets: 0,
      },
      liabilities: {
        mortgageBalance: 0,
        studentLoanBalance: 0,
        autoLoanBalance: 0,
        creditCardBalance: 0,
        otherDebt: 0,
      },
    },
  });

  // Reset when plan loads (Pitfall 2 fix)
  useEffect(() => {
    if (plan) {
      reset({ assets: plan.assets, liabilities: plan.liabilities });
    }
  }, [plan, reset]);

  // D-04 warn-but-allow: show validation warnings but never block advancement
  const handleNext = async () => {
    await trigger(); // Display validation warnings
    // Parse through schema to coerce string inputs to numbers (getValues returns raw strings)
    const values = assetsLiabilitiesSchema.parse(getValues());
    await onComplete({ assets: values.assets, liabilities: values.liabilities });
  };

  return (
    <div className="space-y-8">
      {/* Assets section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-tight text-gray-900">Assets</h2>

        {/* Checking & Savings */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assets.checkingAndSavings"
            className="block text-sm font-normal text-gray-700"
          >
            Checking &amp; Savings
          </label>
          <input
            id="assets.checkingAndSavings"
            type="text"
            inputMode="decimal"
            {...register('assets.checkingAndSavings')}
            aria-invalid={!!errors.assets?.checkingAndSavings}
            aria-describedby={
              errors.assets?.checkingAndSavings
                ? 'assets-checkingAndSavings-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.assets?.checkingAndSavings
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.assets?.checkingAndSavings && (
            <p
              id="assets-checkingAndSavings-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.assets.checkingAndSavings.message}
            </p>
          )}
        </div>

        {/* Retirement Accounts */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assets.retirementAccounts"
            className="block text-sm font-normal text-gray-700"
          >
            Retirement Accounts (401k, IRA)
          </label>
          <input
            id="assets.retirementAccounts"
            type="text"
            inputMode="decimal"
            {...register('assets.retirementAccounts')}
            aria-invalid={!!errors.assets?.retirementAccounts}
            aria-describedby={
              errors.assets?.retirementAccounts ? 'assets-retirementAccounts-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.assets?.retirementAccounts
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.assets?.retirementAccounts && (
            <p
              id="assets-retirementAccounts-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.assets.retirementAccounts.message}
            </p>
          )}
        </div>

        {/* Taxable Investments */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assets.taxableInvestments"
            className="block text-sm font-normal text-gray-700"
          >
            Taxable Investments
          </label>
          <input
            id="assets.taxableInvestments"
            type="text"
            inputMode="decimal"
            {...register('assets.taxableInvestments')}
            aria-invalid={!!errors.assets?.taxableInvestments}
            aria-describedby={
              errors.assets?.taxableInvestments
                ? 'assets-taxableInvestments-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.assets?.taxableInvestments
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.assets?.taxableInvestments && (
            <p
              id="assets-taxableInvestments-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.assets.taxableInvestments.message}
            </p>
          )}
        </div>

        {/* Real Estate Value */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assets.realEstateEquity"
            className="block text-sm font-normal text-gray-700"
          >
            Real Estate Value
          </label>
          <input
            id="assets.realEstateEquity"
            type="text"
            inputMode="decimal"
            {...register('assets.realEstateEquity')}
            aria-invalid={!!errors.assets?.realEstateEquity}
            aria-describedby={
              errors.assets?.realEstateEquity ? 'assets-realEstateEquity-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.assets?.realEstateEquity
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.assets?.realEstateEquity && (
            <p
              id="assets-realEstateEquity-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.assets.realEstateEquity.message}
            </p>
          )}
        </div>

        {/* Other Assets */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="assets.otherAssets"
            className="block text-sm font-normal text-gray-700"
          >
            Other Assets
          </label>
          <input
            id="assets.otherAssets"
            type="text"
            inputMode="decimal"
            {...register('assets.otherAssets')}
            aria-invalid={!!errors.assets?.otherAssets}
            aria-describedby={
              errors.assets?.otherAssets ? 'assets-otherAssets-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.assets?.otherAssets
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.assets?.otherAssets && (
            <p id="assets-otherAssets-error" className="text-sm text-red-600" role="alert">
              {errors.assets.otherAssets.message}
            </p>
          )}
        </div>
      </div>

      {/* Liabilities section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-tight text-gray-900">Liabilities</h2>

        {/* Mortgage Balance */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="liabilities.mortgageBalance"
            className="block text-sm font-normal text-gray-700"
          >
            Mortgage Balance
          </label>
          <input
            id="liabilities.mortgageBalance"
            type="text"
            inputMode="decimal"
            {...register('liabilities.mortgageBalance')}
            aria-invalid={!!errors.liabilities?.mortgageBalance}
            aria-describedby={
              errors.liabilities?.mortgageBalance
                ? 'liabilities-mortgageBalance-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.liabilities?.mortgageBalance
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.liabilities?.mortgageBalance && (
            <p
              id="liabilities-mortgageBalance-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.liabilities.mortgageBalance.message}
            </p>
          )}
        </div>

        {/* Student Loan Balance */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="liabilities.studentLoanBalance"
            className="block text-sm font-normal text-gray-700"
          >
            Student Loan Balance
          </label>
          <input
            id="liabilities.studentLoanBalance"
            type="text"
            inputMode="decimal"
            {...register('liabilities.studentLoanBalance')}
            aria-invalid={!!errors.liabilities?.studentLoanBalance}
            aria-describedby={
              errors.liabilities?.studentLoanBalance
                ? 'liabilities-studentLoanBalance-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.liabilities?.studentLoanBalance
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.liabilities?.studentLoanBalance && (
            <p
              id="liabilities-studentLoanBalance-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.liabilities.studentLoanBalance.message}
            </p>
          )}
        </div>

        {/* Auto Loan Balance */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="liabilities.autoLoanBalance"
            className="block text-sm font-normal text-gray-700"
          >
            Auto Loan Balance
          </label>
          <input
            id="liabilities.autoLoanBalance"
            type="text"
            inputMode="decimal"
            {...register('liabilities.autoLoanBalance')}
            aria-invalid={!!errors.liabilities?.autoLoanBalance}
            aria-describedby={
              errors.liabilities?.autoLoanBalance
                ? 'liabilities-autoLoanBalance-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.liabilities?.autoLoanBalance
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.liabilities?.autoLoanBalance && (
            <p
              id="liabilities-autoLoanBalance-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.liabilities.autoLoanBalance.message}
            </p>
          )}
        </div>

        {/* Credit Card Balance */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="liabilities.creditCardBalance"
            className="block text-sm font-normal text-gray-700"
          >
            Credit Card Balance
          </label>
          <input
            id="liabilities.creditCardBalance"
            type="text"
            inputMode="decimal"
            {...register('liabilities.creditCardBalance')}
            aria-invalid={!!errors.liabilities?.creditCardBalance}
            aria-describedby={
              errors.liabilities?.creditCardBalance
                ? 'liabilities-creditCardBalance-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.liabilities?.creditCardBalance
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.liabilities?.creditCardBalance && (
            <p
              id="liabilities-creditCardBalance-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.liabilities.creditCardBalance.message}
            </p>
          )}
        </div>

        {/* Other Debt */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="liabilities.otherDebt"
            className="block text-sm font-normal text-gray-700"
          >
            Other Debt
          </label>
          <input
            id="liabilities.otherDebt"
            type="text"
            inputMode="decimal"
            {...register('liabilities.otherDebt')}
            aria-invalid={!!errors.liabilities?.otherDebt}
            aria-describedby={
              errors.liabilities?.otherDebt ? 'liabilities-otherDebt-error' : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.liabilities?.otherDebt
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.liabilities?.otherDebt && (
            <p
              id="liabilities-otherDebt-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.liabilities.otherDebt.message}
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
