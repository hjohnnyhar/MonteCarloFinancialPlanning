'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { educationGoalSchema, type EducationGoalFormData } from '@/lib/wizardSchemas';
import type { EducationGoal } from '@/lib/types';

interface EducationGoalFormProps {
  initialData?: EducationGoal;
  onSave: (goal: EducationGoal) => Promise<void>;
  onCancel: () => void;
}

export function EducationGoalForm({ initialData, onSave, onCancel }: EducationGoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EducationGoalFormData>({
    resolver: zodResolver(educationGoalSchema) as unknown as Resolver<EducationGoalFormData>,
    defaultValues: initialData ?? {
      type: 'education' as const,
      beneficiary: '',
      targetAmount: 0,
      targetYear: new Date().getFullYear() + 10,
    },
  });

  const onFormSave = async (data: EducationGoalFormData) => {
    await onSave(data as EducationGoal);
  };

  return (
    <form onSubmit={handleSubmit(onFormSave)} className="space-y-4">
      <input type="hidden" {...register('type')} value="education" />

      {/* Beneficiary */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="education-beneficiary"
          className="block text-sm font-normal text-gray-700"
        >
          Beneficiary
        </label>
        <input
          id="education-beneficiary"
          type="text"
          placeholder="e.g., Child 1"
          {...register('beneficiary')}
          aria-invalid={!!errors.beneficiary}
          aria-describedby={errors.beneficiary ? 'education-beneficiary-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.beneficiary
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.beneficiary && (
          <p id="education-beneficiary-error" className="text-sm text-red-600" role="alert">
            {errors.beneficiary.message}
          </p>
        )}
      </div>

      {/* Target Amount */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="education-targetAmount"
          className="block text-sm font-normal text-gray-700"
        >
          Target Amount
        </label>
        <input
          id="education-targetAmount"
          type="text"
          inputMode="decimal"
          {...register('targetAmount')}
          aria-invalid={!!errors.targetAmount}
          aria-describedby={errors.targetAmount ? 'education-targetAmount-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetAmount
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetAmount && (
          <p id="education-targetAmount-error" className="text-sm text-red-600" role="alert">
            {errors.targetAmount.message}
          </p>
        )}
      </div>

      {/* Target Year */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="education-targetYear"
          className="block text-sm font-normal text-gray-700"
        >
          Target Year
        </label>
        <input
          id="education-targetYear"
          type="text"
          inputMode="numeric"
          {...register('targetYear')}
          aria-invalid={!!errors.targetYear}
          aria-describedby={errors.targetYear ? 'education-targetYear-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetYear
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetYear && (
          <p id="education-targetYear-error" className="text-sm text-red-600" role="alert">
            {errors.targetYear.message}
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
