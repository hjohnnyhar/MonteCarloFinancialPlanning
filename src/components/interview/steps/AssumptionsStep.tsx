'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { assumptionsSchema, type AssumptionsFormData } from '@/lib/wizardSchemas';
import type { FinancialPlan } from '@/lib/types';

interface StepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: (() => void) | null;
}

// zodResolver v5 returns Resolver<unknown> due to z.coerce — cast required
const assumptionsResolver: Resolver<AssumptionsFormData> = zodResolver(assumptionsSchema) as unknown as Resolver<AssumptionsFormData>;

export function AssumptionsStep({ plan, onComplete, onBack }: StepProps) {
  const {
    register,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm<AssumptionsFormData>({
    resolver: assumptionsResolver,
    defaultValues: {
      planAssumptions: {
        goodsInflation: 2.5,
        servicesInflation: 2.5,
        healthcareInflation: 2.5,
        educationInflation: 2.5,
        includeSocialSecurity: false,
      },
    },
  });

  // Reset from plan data when plan loads — convert stored decimals to display percentages
  useEffect(() => {
    if (plan?.planAssumptions) {
      reset({
        planAssumptions: {
          goodsInflation: plan.planAssumptions.goodsInflation * 100,
          servicesInflation: plan.planAssumptions.servicesInflation * 100,
          healthcareInflation: plan.planAssumptions.healthcareInflation * 100,
          educationInflation: plan.planAssumptions.educationInflation * 100,
          includeSocialSecurity: plan.planAssumptions.includeSocialSecurity,
        },
      });
    }
  }, [plan, reset]);

  const handleNext = async () => {
    await trigger();
    // Parse through schema to coerce and transform (percentages -> decimals)
    const parsed = assumptionsSchema.parse(getValues());
    await onComplete({ planAssumptions: parsed.planAssumptions });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        <h2 className="text-xl font-semibold leading-tight text-gray-900">Inflation Assumptions</h2>

        {/* Goods Inflation */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="planAssumptions.goodsInflation"
            className="block text-sm font-normal text-gray-700"
          >
            Goods Inflation (%)
          </label>
          <input
            id="planAssumptions.goodsInflation"
            type="text"
            inputMode="decimal"
            placeholder="2.5"
            {...register('planAssumptions.goodsInflation')}
            aria-invalid={!!errors.planAssumptions?.goodsInflation}
            aria-describedby={
              errors.planAssumptions?.goodsInflation
                ? 'planAssumptions-goodsInflation-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.planAssumptions?.goodsInflation
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.planAssumptions?.goodsInflation && (
            <p
              id="planAssumptions-goodsInflation-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.planAssumptions.goodsInflation.message}
            </p>
          )}
        </div>

        {/* Services Inflation */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="planAssumptions.servicesInflation"
            className="block text-sm font-normal text-gray-700"
          >
            Services Inflation (%)
          </label>
          <input
            id="planAssumptions.servicesInflation"
            type="text"
            inputMode="decimal"
            placeholder="2.5"
            {...register('planAssumptions.servicesInflation')}
            aria-invalid={!!errors.planAssumptions?.servicesInflation}
            aria-describedby={
              errors.planAssumptions?.servicesInflation
                ? 'planAssumptions-servicesInflation-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.planAssumptions?.servicesInflation
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.planAssumptions?.servicesInflation && (
            <p
              id="planAssumptions-servicesInflation-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.planAssumptions.servicesInflation.message}
            </p>
          )}
        </div>

        {/* Healthcare Inflation */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="planAssumptions.healthcareInflation"
            className="block text-sm font-normal text-gray-700"
          >
            Healthcare Inflation (%)
          </label>
          <input
            id="planAssumptions.healthcareInflation"
            type="text"
            inputMode="decimal"
            placeholder="2.5"
            {...register('planAssumptions.healthcareInflation')}
            aria-invalid={!!errors.planAssumptions?.healthcareInflation}
            aria-describedby={
              errors.planAssumptions?.healthcareInflation
                ? 'planAssumptions-healthcareInflation-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.planAssumptions?.healthcareInflation
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.planAssumptions?.healthcareInflation && (
            <p
              id="planAssumptions-healthcareInflation-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.planAssumptions.healthcareInflation.message}
            </p>
          )}
        </div>

        {/* Education Inflation */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="planAssumptions.educationInflation"
            className="block text-sm font-normal text-gray-700"
          >
            Education Inflation (%)
          </label>
          <input
            id="planAssumptions.educationInflation"
            type="text"
            inputMode="decimal"
            placeholder="2.5"
            {...register('planAssumptions.educationInflation')}
            aria-invalid={!!errors.planAssumptions?.educationInflation}
            aria-describedby={
              errors.planAssumptions?.educationInflation
                ? 'planAssumptions-educationInflation-error'
                : undefined
            }
            className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
              errors.planAssumptions?.educationInflation
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.planAssumptions?.educationInflation && (
            <p
              id="planAssumptions-educationInflation-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.planAssumptions.educationInflation.message}
            </p>
          )}
        </div>

        {/* Social Security toggle */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-gray-900">Social Security</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('planAssumptions.includeSocialSecurity')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-normal text-gray-700">
              Include Social Security estimates
            </span>
          </label>
        </div>
      </div>

      {/* Navigation buttons */}
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
