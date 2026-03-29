// src/lib/planDefaults.ts
import type { FinancialPlan } from './types';

export function createEmptyPlan(): FinancialPlan {
  const now = new Date().toISOString();
  return {
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      wizardStep: 0,
    },
    income: {
      salary: 0,
      otherAnnualIncome: 0,
      annualSavingsRate: 0,
    },
    expenses: {
      monthlyEssential: 0,
      monthlyDiscretionary: 0,
      monthlyDebtPayments: 0,
    },
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
    goals: [],
    riskTolerance: {
      score: 0,
      level: null,
      answers: {},
    },
    simulationResults: null,
  };
}
