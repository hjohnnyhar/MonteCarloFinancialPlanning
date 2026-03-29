'use client';

import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { peopleSchema, type PeopleFormData } from '@/lib/wizardSchemas';
import type { FinancialPlan } from '@/lib/types';

interface StepProps {
  plan: FinancialPlan;
  onComplete: (data: Partial<FinancialPlan>) => Promise<void>;
  onBack: null;
}

// zodResolver v5 returns Resolver<unknown> due to z.coerce — cast required
const peopleResolver: Resolver<PeopleFormData> = zodResolver(peopleSchema) as unknown as Resolver<PeopleFormData>;

const emptyPerson = {
  name: '',
  sex: 'other' as const,
  birthdate: '',
  annualSalary: 0,
  otherAnnualIncome: 0,
  retirementAge: null as number | null,
};

const inputClass = (hasError: boolean) =>
  `w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

export function PeopleStep({ plan, onComplete }: StepProps) {
  const defaultPeople =
    plan.people && plan.people.length > 0
      ? plan.people
      : [{ ...emptyPerson }];

  const {
    register,
    control,
    formState: { errors },
    trigger,
    getValues,
    reset,
    watch,
  } = useForm<PeopleFormData>({
    resolver: peopleResolver,
    defaultValues: {
      people: defaultPeople,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'people' });

  // Keep personCount in sync with the number of fields
  const personCount = fields.length;

  // Reset form when plan changes (e.g. resume)
  useEffect(() => {
    if (plan) {
      const initialPeople = plan.people && plan.people.length > 0 ? plan.people : [{ ...emptyPerson }];
      reset({ people: initialPeople });
    }
  }, [plan, reset]);

  const handleSetPersonCount = (count: 1 | 2) => {
    if (count === 1 && personCount === 2) {
      remove(1);
    } else if (count === 2 && personCount === 1) {
      append({ ...emptyPerson });
    }
  };

  const handleNext = async () => {
    await trigger();
    const values = peopleSchema.parse(getValues());
    await onComplete({ people: values.people });
  };

  // Watch salary and other income for each person to conditionally show retirement age
  const watchedPeople = watch('people');

  return (
    <div className="space-y-8">
      {/* Person count selector */}
      <div className="space-y-3">
        <p className="text-sm font-normal text-gray-700">How many people in this plan?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSetPersonCount(1)}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              personCount === 1
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            Just me (1)
          </button>
          <button
            type="button"
            onClick={() => handleSetPersonCount(2)}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              personCount === 2
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            My partner and me (2)
          </button>
        </div>
      </div>

      {/* Person cards */}
      {fields.map((field, idx) => {
        const personErrors = errors.people?.[idx];
        const personValues = watchedPeople?.[idx];
        const hasSalaryOrIncome =
          Number(personValues?.annualSalary ?? 0) > 0 ||
          Number(personValues?.otherAnnualIncome ?? 0) > 0;

        return (
          <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
            <h2 className="text-xl font-semibold leading-tight text-gray-900">
              {idx === 0 ? 'Primary Person' : 'Second Person'}
            </h2>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor={`people.${idx}.name`} className="block text-sm font-normal text-gray-700">
                First Name
              </label>
              <input
                id={`people.${idx}.name`}
                type="text"
                {...register(`people.${idx}.name`)}
                aria-invalid={!!personErrors?.name}
                aria-describedby={personErrors?.name ? `people-${idx}-name-error` : undefined}
                className={inputClass(!!personErrors?.name)}
              />
              {personErrors?.name && (
                <p id={`people-${idx}-name-error`} className="text-sm text-red-600" role="alert">
                  {personErrors.name.message}
                </p>
              )}
            </div>

            {/* Sex */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-normal text-gray-700">Sex</p>
              <div className="flex gap-6">
                {(['male', 'female', 'other'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      value={s}
                      {...register(`people.${idx}.sex`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
              {personErrors?.sex && (
                <p className="text-sm text-red-600" role="alert">{personErrors.sex.message}</p>
              )}
            </div>

            {/* Date of birth */}
            <div className="flex flex-col gap-1">
              <label htmlFor={`people.${idx}.birthdate`} className="block text-sm font-normal text-gray-700">
                Date of Birth
              </label>
              <input
                id={`people.${idx}.birthdate`}
                type="date"
                {...register(`people.${idx}.birthdate`)}
                aria-invalid={!!personErrors?.birthdate}
                aria-describedby={personErrors?.birthdate ? `people-${idx}-birthdate-error` : undefined}
                className={inputClass(!!personErrors?.birthdate)}
              />
              {personErrors?.birthdate && (
                <p id={`people-${idx}-birthdate-error`} className="text-sm text-red-600" role="alert">
                  {personErrors.birthdate.message}
                </p>
              )}
            </div>

            {/* Annual Salary */}
            <div className="flex flex-col gap-1">
              <label htmlFor={`people.${idx}.annualSalary`} className="block text-sm font-normal text-gray-700">
                Annual Salary
              </label>
              <input
                id={`people.${idx}.annualSalary`}
                type="text"
                inputMode="decimal"
                {...register(`people.${idx}.annualSalary`)}
                aria-invalid={!!personErrors?.annualSalary}
                aria-describedby={personErrors?.annualSalary ? `people-${idx}-salary-error` : undefined}
                className={inputClass(!!personErrors?.annualSalary)}
              />
              {personErrors?.annualSalary && (
                <p id={`people-${idx}-salary-error`} className="text-sm text-red-600" role="alert">
                  {personErrors.annualSalary.message}
                </p>
              )}
            </div>

            {/* Other Annual Income */}
            <div className="flex flex-col gap-1">
              <label htmlFor={`people.${idx}.otherAnnualIncome`} className="block text-sm font-normal text-gray-700">
                Other Annual Income
              </label>
              <p className="text-sm text-gray-500">Rental, freelance, etc.</p>
              <input
                id={`people.${idx}.otherAnnualIncome`}
                type="text"
                inputMode="decimal"
                {...register(`people.${idx}.otherAnnualIncome`)}
                aria-invalid={!!personErrors?.otherAnnualIncome}
                aria-describedby={personErrors?.otherAnnualIncome ? `people-${idx}-other-error` : undefined}
                className={inputClass(!!personErrors?.otherAnnualIncome)}
              />
              {personErrors?.otherAnnualIncome && (
                <p id={`people-${idx}-other-error`} className="text-sm text-red-600" role="alert">
                  {personErrors.otherAnnualIncome.message}
                </p>
              )}
            </div>

            {/* Retirement Age — only shown if person has any income */}
            {hasSalaryOrIncome && (
              <div className="flex flex-col gap-1">
                <label htmlFor={`people.${idx}.retirementAge`} className="block text-sm font-normal text-gray-700">
                  Retirement Age
                </label>
                <input
                  id={`people.${idx}.retirementAge`}
                  type="text"
                  inputMode="numeric"
                  {...register(`people.${idx}.retirementAge`)}
                  aria-invalid={!!personErrors?.retirementAge}
                  aria-describedby={personErrors?.retirementAge ? `people-${idx}-retage-error` : undefined}
                  className={inputClass(!!personErrors?.retirementAge)}
                />
                {personErrors?.retirementAge && (
                  <p id={`people-${idx}-retage-error`} className="text-sm text-red-600" role="alert">
                    {personErrors.retirementAge.message}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        <div />
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
