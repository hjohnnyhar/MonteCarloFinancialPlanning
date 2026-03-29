import { describe, it, expect } from 'vitest';
import { createEmptyPlan } from '../planDefaults';

describe('createEmptyPlan', () => {
  it('returns simulationResults as null (simulation not yet run)', () => {
    expect(createEmptyPlan().simulationResults).toBeNull();
  });

  it('returns income.annualSavingsRate as 0 (number, not undefined)', () => {
    expect(createEmptyPlan().income.annualSavingsRate).toBe(0);
    expect(typeof createEmptyPlan().income.annualSavingsRate).toBe('number');
  });

  it('returns people as an empty array', () => {
    const plan = createEmptyPlan();
    expect(plan.people).toEqual([]);
    expect(Array.isArray(plan.people)).toBe(true);
  });

  it('returns goals as an empty array', () => {
    const plan = createEmptyPlan();
    expect(plan.goals).toEqual([]);
    expect(Array.isArray(plan.goals)).toBe(true);
  });

  it('returns riskTolerance.score as 0', () => {
    expect(createEmptyPlan().riskTolerance.score).toBe(0);
  });

  it('returns metadata.createdAt as a non-empty ISO string', () => {
    const plan = createEmptyPlan();
    expect(plan.metadata.createdAt).toBeTruthy();
    expect(new Date(plan.metadata.createdAt).toISOString()).toBe(plan.metadata.createdAt);
  });

  it('returns metadata.updatedAt matching createdAt at creation time', () => {
    const plan = createEmptyPlan();
    expect(plan.metadata.updatedAt).toBeTruthy();
    expect(typeof plan.metadata.updatedAt).toBe('string');
  });

  it('should initialize wizardStep to 0', () => {
    const plan = createEmptyPlan();
    expect(plan.metadata.wizardStep).toBe(0);
  });

  it('returns all nested objects with no undefined fields', () => {
    const plan = createEmptyPlan();
    expect(plan.income.annualSavingsRate).toBe(0);
    expect(plan.expenses.monthlyEssential).toBe(0);
    expect(plan.expenses.monthlyDiscretionary).toBe(0);
    expect(plan.expenses.monthlyDebtPayments).toBe(0);
    expect(plan.assets.checkingAndSavings).toBe(0);
    expect(plan.assets.retirementAccounts).toBe(0);
    expect(plan.assets.taxableInvestments).toBe(0);
    expect(plan.assets.realEstateEquity).toBe(0);
    expect(plan.assets.otherAssets).toBe(0);
    expect(plan.liabilities.mortgageBalance).toBe(0);
    expect(plan.liabilities.studentLoanBalance).toBe(0);
    expect(plan.liabilities.autoLoanBalance).toBe(0);
    expect(plan.liabilities.creditCardBalance).toBe(0);
    expect(plan.liabilities.otherDebt).toBe(0);
    expect(plan.riskTolerance.level).toBeNull();
    expect(plan.riskTolerance.answers).toEqual({});
    expect(plan.metadata.version).toBe(1);
  });
});
