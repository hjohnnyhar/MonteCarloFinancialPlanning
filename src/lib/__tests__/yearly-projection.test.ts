import { describe, it, expect } from 'vitest';
import { extractMedianPath, runSimulation } from '@/lib/simulation';
import { createEmptyPlan } from '@/lib/planDefaults';
import type { FinancialPlan } from '@/lib/types';

function makeTestPlan(overrides?: Partial<FinancialPlan>): FinancialPlan {
  const base = createEmptyPlan();
  return {
    ...base,
    currentAge: 35,
    income: { salary: 100000, otherAnnualIncome: 0, annualSavingsRate: 0.15 },
    expenses: {
      monthlyEssential: 2000,
      monthlyDiscretionary: 1000,
      monthlyDebtPayments: 200,
    },
    assets: {
      checkingAndSavings: 50000,
      retirementAccounts: 100000,
      taxableInvestments: 20000,
      realEstateEquity: 0,
      otherAssets: 0,
    },
    riskTolerance: { score: 7, level: 'moderate', answers: {} },
    goals: [
      { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 60000, yearsInRetirement: 25 },
    ],
    ...overrides,
  };
}

describe('extractMedianPath', () => {
  it('returns one snapshot per year for the plan horizon', () => {
    const plan = makeTestPlan();
    const projection = extractMedianPath(plan);

    // Plan horizon for age 35, retiring at 65 with 25 years in retirement = 55 years
    expect(projection.length).toBeGreaterThan(0);
    // Each year should have a unique year value
    const years = projection.map((s) => s.year);
    const uniqueYears = new Set(years);
    expect(uniqueYears.size).toBe(projection.length);
  });

  it('each snapshot has all required fields with correct types', () => {
    const plan = makeTestPlan();
    const projection = extractMedianPath(plan);

    for (const snapshot of projection) {
      expect(snapshot).toHaveProperty('year');
      expect(snapshot).toHaveProperty('age');
      expect(snapshot).toHaveProperty('portfolioValue');
      expect(snapshot).toHaveProperty('annualSavings');
      expect(snapshot).toHaveProperty('annualWithdrawal');
      expect(snapshot).toHaveProperty('goalMilestone');

      expect(typeof snapshot.year).toBe('number');
      expect(typeof snapshot.age).toBe('number');
      expect(typeof snapshot.portfolioValue).toBe('number');
      expect(typeof snapshot.annualSavings).toBe('number');
      expect(typeof snapshot.annualWithdrawal).toBe('number');
      // goalMilestone is string | null
      expect(snapshot.goalMilestone === null || typeof snapshot.goalMilestone === 'string').toBe(true);
    }
  });

  it('portfolio value is non-negative for all snapshots', () => {
    const plan = makeTestPlan();
    const projection = extractMedianPath(plan);

    for (const snapshot of projection) {
      expect(snapshot.portfolioValue).toBeGreaterThanOrEqual(0);
    }
  });

  it('age increments by 1 each year starting from currentAge + 1', () => {
    const plan = makeTestPlan({ currentAge: 40 });
    const projection = extractMedianPath(plan);

    expect(projection[0].age).toBe(41);
    for (let i = 1; i < projection.length; i++) {
      expect(projection[i].age).toBe(projection[i - 1].age + 1);
    }
  });

  it('goal milestone marker appears at the retirement year', () => {
    const plan = makeTestPlan({
      currentAge: 35,
      goals: [
        { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 60000, yearsInRetirement: 25 },
      ],
    });
    const projection = extractMedianPath(plan);

    // Retirement is 30 years from now (year index 29, so snapshot index 29)
    const retirementSnapshot = projection.find((s) => s.age === 65);
    expect(retirementSnapshot).toBeDefined();
    expect(retirementSnapshot?.goalMilestone).not.toBeNull();
    expect(retirementSnapshot?.goalMilestone).toContain('Retirement');
  });

  it('goal milestone marker appears at the correct year for a purchase goal', () => {
    const currentYear = new Date().getFullYear();
    const targetYear = currentYear + 10;
    const plan = makeTestPlan({
      goals: [
        { type: 'purchase', description: 'Beach house', targetAmount: 200000, targetYear },
      ],
    });
    const projection = extractMedianPath(plan);

    const purchaseSnapshot = projection.find((s) => s.year === targetYear);
    expect(purchaseSnapshot).toBeDefined();
    expect(purchaseSnapshot?.goalMilestone).not.toBeNull();
    expect(purchaseSnapshot?.goalMilestone).toContain('Beach house');
  });

  it('accumulation phase snapshots have annualSavings > 0 and annualWithdrawal = 0', () => {
    const plan = makeTestPlan({
      currentAge: 35,
      goals: [
        { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 60000, yearsInRetirement: 25 },
      ],
    });
    const projection = extractMedianPath(plan);

    // Years up to and including retirement age are accumulation (snapshot is end-of-year state,
    // so age 65 = yearIdx 29 = last accumulation year)
    const accumulationYears = projection.filter((s) => s.age <= 65);
    expect(accumulationYears.length).toBeGreaterThan(0);
    for (const snap of accumulationYears) {
      expect(snap.annualSavings).toBeGreaterThan(0);
      expect(snap.annualWithdrawal).toBe(0);
    }
  });

  it('decumulation phase snapshots have annualWithdrawal > 0 and annualSavings = 0', () => {
    const plan = makeTestPlan({
      currentAge: 35,
      goals: [
        { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 60000, yearsInRetirement: 25 },
      ],
    });
    const projection = extractMedianPath(plan);

    // Decumulation starts the year after retirement age (the snapshot marks end-of-year state,
    // so year 30 in 0-index = age 66 is when withdrawals first appear).
    const decumulationYears = projection.filter((s) => s.age > 65);
    expect(decumulationYears.length).toBeGreaterThan(0);
    for (const snap of decumulationYears) {
      expect(snap.annualWithdrawal).toBeGreaterThan(0);
      expect(snap.annualSavings).toBe(0);
    }
  });

  it('yearlyProjection is included in runSimulation results', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    expect(result.yearlyProjection).toBeDefined();
    expect(Array.isArray(result.yearlyProjection)).toBe(true);
    expect((result.yearlyProjection ?? []).length).toBeGreaterThan(0);
  });
});
