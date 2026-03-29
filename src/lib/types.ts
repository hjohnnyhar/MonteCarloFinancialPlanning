// src/lib/types.ts

export type GoalType = 'retirement' | 'purchase' | 'education' | 'legacy';

export interface PlanAssumptions {
  goodsInflation: number;       // decimal, e.g. 0.025
  servicesInflation: number;
  healthcareInflation: number;
  educationInflation: number;
  includeSocialSecurity: boolean;
}

export interface Person {
  name: string;
  sex: 'male' | 'female' | 'other';
  birthdate: string; // ISO date string, e.g. "1990-06-15"
  annualSalary: number;
  otherAnnualIncome: number;
  retirementAge: number | null; // null if not planning to retire
}

export interface RetirementGoal {
  type: 'retirement';
  targetRetirementAge: number;
  desiredAnnualIncome: number; // in today's dollars
}

export interface PurchaseGoal {
  type: 'purchase';
  description: string;
  targetAmount: number;
  targetYear: number;
}

export interface EducationGoal {
  type: 'education';
  beneficiary: string; // e.g., "child 1"
  targetAmount: number;
  targetYear: number;
}

export interface LegacyGoal {
  type: 'legacy';
  description: string;
  targetAmount: number;
}

export type Goal = RetirementGoal | PurchaseGoal | EducationGoal | LegacyGoal;

export interface Income {
  annualSavingsRate: number; // 0–1 (e.g., 0.15 = 15%)
}

export interface Expenses {
  monthlyEssential: number; // rent, utilities, food
  monthlyDiscretionary: number; // dining, entertainment
  monthlyDebtPayments: number;
}

export interface Assets {
  checkingAndSavings: number;
  retirementAccounts: number; // 401k, IRA
  taxableInvestments: number;
  realEstateEquity: number;
  otherAssets: number;
}

export interface Liabilities {
  mortgageBalance: number;
  studentLoanBalance: number;
  autoLoanBalance: number;
  creditCardBalance: number;
  otherDebt: number;
}

export type RiskToleranceLevel = 'conservative' | 'moderate' | 'aggressive';

export interface RiskTolerance {
  score: number; // 1–10 from questionnaire
  level: RiskToleranceLevel | null; // derived from score; null until answered
  answers: Record<string, number>; // questionId -> answer value
}

export interface GoalResult {
  goalIndex: number;
  goalType: GoalType;
  probabilityScore: number; // 0–1
  fundingGap: number; // positive = shortfall in today's dollars
  targetAmount: number;
}

export interface Recommendation {
  lever: 'savings_increase' | 'retirement_delay' | 'spending_reduction' | 'goal_reduction';
  summary: string;
  currentValue: number;
  suggestedValue: number;
  projectedScore: number;
}

export interface YearlySnapshot {
  year: number;
  age: number;
  portfolioValue: number;
  annualSavings: number;
  annualWithdrawal: number;
  goalMilestone: string | null;
}

export interface ScoreTier {
  label: 'Strong plan' | 'On track' | 'At risk';
  color: 'green' | 'amber' | 'red';
}

export interface SimulationResults {
  overallProbability: number; // 0–1
  goalResults: GoalResult[];
  runCount: number; // number of Monte Carlo iterations
  assumptions: {
    inflationRate: number; // e.g., 0.03
    realReturnMean: number; // e.g., 0.07
    realReturnStdDev: number; // e.g., 0.12
  };
  ranAt: string; // ISO timestamp
  recommendations?: Recommendation[];
  yearlyProjection?: YearlySnapshot[];
  scoreTier?: ScoreTier;
}

export interface PlanMetadata {
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  version: number; // increment on each save
  wizardStep?: number; // Persisted wizard progress index (0-based)
}

export interface FinancialPlan {
  metadata: PlanMetadata;
  people: Person[];
  planAssumptions: PlanAssumptions;
  income: Income;
  expenses: Expenses;
  assets: Assets;
  liabilities: Liabilities;
  goals: Goal[];
  riskTolerance: RiskTolerance;
  simulationResults: SimulationResults | null;
}
