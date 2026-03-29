'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseGoalSchema, type PurchaseGoalFormData } from '@/lib/wizardSchemas';
import type { PurchaseGoal } from '@/lib/types';

interface PurchaseGoalFormProps {
  initialData?: PurchaseGoal;
  onSave: (goal: PurchaseGoal) => Promise<void>;
  onCancel: () => void;
}

export function PurchaseGoalForm({ initialData, onSave, onCancel }: PurchaseGoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseGoalFormData>({
    resolver: zodResolver(purchaseGoalSchema) as unknown as Resolver<PurchaseGoalFormData>,
    defaultValues: initialData ?? {
      type: 'purchase' as const,
      description: '',
      targetAmount: 0,
      targetYear: new Date().getFullYear() + 5,
    },
  });

  const onFormSave = async (data: PurchaseGoalFormData) => {
    await onSave(data as PurchaseGoal);
  };

  return (
    <form onSubmit={handleSubmit(onFormSave)} className="space-y-4">
      <input type="hidden" {...register('type')} value="purchase" />

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="purchase-description"
          className="block text-sm font-normal text-gray-700"
        >
          Description
        </label>
        <input
          id="purchase-description"
          type="text"
          placeholder="e.g., New car, Home renovation"
          {...register('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'purchase-description-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.description
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.description && (
          <p id="purchase-description-error" className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Target Amount */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="purchase-targetAmount"
          className="block text-sm font-normal text-gray-700"
        >
          Target Amount
        </label>
        <input
          id="purchase-targetAmount"
          type="text"
          inputMode="decimal"
          {...register('targetAmount')}
          aria-invalid={!!errors.targetAmount}
          aria-describedby={errors.targetAmount ? 'purchase-targetAmount-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetAmount
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetAmount && (
          <p id="purchase-targetAmount-error" className="text-sm text-red-600" role="alert">
            {errors.targetAmount.message}
          </p>
        )}
      </div>

      {/* Target Year */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="purchase-targetYear"
          className="block text-sm font-normal text-gray-700"
        >
          Target Year
        </label>
        <input
          id="purchase-targetYear"
          type="text"
          inputMode="numeric"
          {...register('targetYear')}
          aria-invalid={!!errors.targetYear}
          aria-describedby={errors.targetYear ? 'purchase-targetYear-error' : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.targetYear
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
        {errors.targetYear && (
          <p id="purchase-targetYear-error" className="text-sm text-red-600" role="alert">
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
