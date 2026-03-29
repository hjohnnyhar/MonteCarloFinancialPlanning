'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { retirementGoalSchema, type RetirementGoalFormData } from '@/lib/wizardSchemas';
import type { RetirementGoal, FinancialPlan } from '@/lib/types';

interface RetirementGoalFormProps {
  initialData?: RetirementGoal;
  onSave: (goal: RetirementGoal) => Promise<void>;
  onCancel: () => void;
  plan?: FinancialPlan;
}

export function RetirementGoalForm({ initialData, onSave, onCancel, plan }: RetirementGoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RetirementGoalFormData>({
    resolver: zodResolver(retirementGoalSchema) as unknown as Resolver<RetirementGoalFormData>,
    defaultValues: initialData ?? {
      type: 'retirement' as const,
      targetRetirementAge: plan?.people?.[0]?.retirementAge ?? 65,
      desiredAnnualIncome: 0,
    },
  });

  const onFormSave = async (data: RetirementGoalFormData) => {
    await onSave(data as RetirementGoal);
  };

  return (
    <form onSubmit={handleSubmit(onFormSave)} className="space-y-4">
      <input type="hidden" {...register('type')} value="retirement" />

      {/* Target Retirement Age */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="retirement-targetRetirementAge"
          className="block text-sm font-normal text-gray-700"
        >
          Target Retirement Age
        </label>
        <input
          id="retirement-targetRetirementAge"
          type="text"
          inputMode="numeric"
          {...register('targetRetirementAge')}
          aria-invalid={!!errors.targetRetirementAge}
          aria-describedby={
            errors.targetRetirementAge ? 'retirement-targetRetirementAge-error' : undefined
          }
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetRetirementAge
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetRetirementAge && (
          <p
            id="retirement-targetRetirementAge-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {errors.targetRetirementAge.message}
          </p>
        )}
      </div>

      {/* Desired Annual Retirement Income */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="retirement-desiredAnnualIncome"
          className="block text-sm font-normal text-gray-700"
        >
          Desired Annual Retirement Income
        </label>
        <input
          id="retirement-desiredAnnualIncome"
          type="text"
          inputMode="decimal"
          {...register('desiredAnnualIncome')}
          aria-invalid={!!errors.desiredAnnualIncome}
          aria-describedby={
            errors.desiredAnnualIncome ? 'retirement-desiredAnnualIncome-error' : undefined
          }
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.desiredAnnualIncome
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.desiredAnnualIncome && (
          <p
            id="retirement-desiredAnnualIncome-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {errors.desiredAnnualIncome.message}
          </p>
        )}
      </div>

      {/* Button row */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Goal
        </button>
      </div>
    </form>
  );
}
