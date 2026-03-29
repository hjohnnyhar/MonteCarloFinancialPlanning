export interface WizardStepConfig {
  id: string;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'income-expenses', title: 'Income & Expenses', description: 'Salary, savings rate, and monthly spending' },
  { id: 'assets-liabilities', title: 'Assets & Liabilities', description: 'Accounts, investments, and debts' },
  { id: 'goals', title: 'Financial Goals', description: 'Retirement, purchases, education, legacy' },
  { id: 'risk-tolerance', title: 'Risk Tolerance', description: 'Your investment comfort level' },
  { id: 'review', title: 'Review & Confirm', description: 'Confirm your information' },
];
