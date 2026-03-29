import { z } from 'zod';

const currencyField = z.coerce.number().min(0, 'Must be 0 or greater.');
const rateField = z.coerce.number().min(0, 'Must be 0 or greater.').max(1, 'Must be between 0% and 100%.');

export const personSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  sex: z.enum(['male', 'female', 'other']),
  birthdate: z.string().min(1, 'Date of birth is required.'),
  annualSalary: z.coerce.number().min(0),
  otherAnnualIncome: z.coerce.number().min(0),
  retirementAge: z.coerce.number().min(1).nullable(),
});

export const peopleSchema = z.object({
  people: z.array(personSchema).min(1, 'At least one person is required.'),
});

export const incomeExpensesSchema = z.object({
  income: z.object({
    annualSavingsRate: rateField,
  }),
  expenses: z.object({
    monthlyEssential: currencyField,
    monthlyDiscretionary: currencyField,
    monthlyDebtPayments: currencyField,
  }),
});

export const assetsLiabilitiesSchema = z.object({
  assets: z.object({
    checkingAndSavings: currencyField,
    retirementAccounts: currencyField,
    taxableInvestments: currencyField,
    realEstateEquity: currencyField,
    otherAssets: currencyField,
  }),
  liabilities: z.object({
    mortgageBalance: currencyField,
    studentLoanBalance: currencyField,
    autoLoanBalance: currencyField,
    creditCardBalance: currencyField,
    otherDebt: currencyField,
  }),
});

export const retirementGoalSchema = z.object({
  type: z.literal('retirement'),
  targetRetirementAge: z.coerce.number().min(1, 'Required.'),
  desiredAnnualIncome: currencyField,
});

export const purchaseGoalSchema = z.object({
  type: z.literal('purchase'),
  description: z.string().min(1, 'This field is required.'),
  targetAmount: currencyField,
  targetYear: z.coerce.number().min(2024, 'Target date is required.'),
});

export const educationGoalSchema = z.object({
  type: z.literal('education'),
  beneficiary: z.string().min(1, 'This field is required.'),
  targetAmount: currencyField,
  targetYear: z.coerce.number().min(2024, 'Target date is required.'),
});

export const legacyGoalSchema = z.object({
  type: z.literal('legacy'),
  description: z.string().min(1, 'This field is required.'),
  targetAmount: currencyField,
});

export const riskToleranceSchema = z.object({
  answers: z.record(z.string(), z.number()),
});

// Type exports for form data
export type PeopleFormData = z.infer<typeof peopleSchema>;
export type IncomeExpensesFormData = z.infer<typeof incomeExpensesSchema>;
export type AssetsLiabilitiesFormData = z.infer<typeof assetsLiabilitiesSchema>;
export type RetirementGoalFormData = z.infer<typeof retirementGoalSchema>;
export type PurchaseGoalFormData = z.infer<typeof purchaseGoalSchema>;
export type EducationGoalFormData = z.infer<typeof educationGoalSchema>;
export type LegacyGoalFormData = z.infer<typeof legacyGoalSchema>;
