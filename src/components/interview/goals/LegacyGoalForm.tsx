'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { legacyGoalSchema, type LegacyGoalFormData } from '@/lib/wizardSchemas';
import type { LegacyGoal } from '@/lib/types';

interface LegacyGoalFormProps {
  initialData?: LegacyGoal;
  onSave: (goal: LegacyGoal) => Promise<void>;
  onCancel: () => void;
}

export function LegacyGoalForm({ initialData, onSave, onCancel }: LegacyGoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LegacyGoalFormData>({
    resolver: zodResolver(legacyGoalSchema) as Resolver<LegacyGoalFormData>,
    defaultValues: initialData ?? {
      type: 'legacy' as const,
      description: '',
      targetAmount: 0,
    },
  });

  const onFormSave = async (data: LegacyGoalFormData) => {
    await onSave(data as LegacyGoal);
  };

  return (
    <form onSubmit={handleSubmit(onFormSave)} className="space-y-4">
      <input type="hidden" {...register('type')} value="legacy" />

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="legacy-description"
          className="block text-sm font-normal text-gray-700"
        >
          Description
        </label>
        <input
          id="legacy-description"
          type="text"
          placeholder="e.g., Estate for children"
          {...register('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'legacy-description-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.description
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.description && (
          <p id="legacy-description-error" className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Target Amount */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="legacy-targetAmount"
          className="block text-sm font-normal text-gray-700"
        >
          Target Amount
        </label>
        <input
          id="legacy-targetAmount"
          type="text"
          inputMode="decimal"
          {...register('targetAmount')}
          aria-invalid={!!errors.targetAmount}
          aria-describedby={errors.targetAmount ? 'legacy-targetAmount-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetAmount
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetAmount && (
          <p id="legacy-targetAmount-error" className="text-sm text-red-600" role="alert">
            {errors.targetAmount.message}
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
