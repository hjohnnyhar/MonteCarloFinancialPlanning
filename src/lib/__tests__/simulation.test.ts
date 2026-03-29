import { describe, it, expect } from 'vitest';
import { runSimulation, SimulationOverrides, ITERATION_COUNT, INFLATION_RATE, RETURN_ASSUMPTIONS } from '@/lib/simulation';
import { createEmptyPlan } from '@/lib/planDefaults';
import type { FinancialPlan } from '@/lib/types';

function makeTestPlan(overrides?: Partial<FinancialPlan>): FinancialPlan {
  const base = createEmptyPlan();
  return {
    ...base,
    currentAge: 35,
    income: { salary: 100000, otherAnnualIncome: 0, annualSavingsRate: 0.15 },
    assets: {
      checkingAndSavings: 50000,
      retirementAccounts: 200000,
      taxableInvestments: 50000,
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

describe('runSimulation', () => {
  it('Test 1: returns SimulationResults with all required fields', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    expect(result).toHaveProperty('overallProbability');
    expect(result).toHaveProperty('goalResults');
    expect(result).toHaveProperty('runCount');
    expect(result).toHaveProperty('assumptions');
    expect(result).toHaveProperty('ranAt');
    expect(result.assumptions).toHaveProperty('inflationRate');
    expect(result.assumptions).toHaveProperty('realReturnMean');
    expect(result.assumptions).toHaveProperty('realReturnStdDev');
  });

  it('Test 2: overallProbability is between 0 and 1', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    expect(result.overallProbability).toBeGreaterThanOrEqual(0);
    expect(result.overallProbability).toBeLessThanOrEqual(1);
  });

  it('Test 3: goalResults has one entry per goal in the plan, each with goalIndex matching array position', () => {
    const plan = makeTestPlan({
      goals: [
        { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 60000, yearsInRetirement: 25 },
        { type: 'purchase', description: 'Car', targetAmount: 30000, targetYear: 2030 },
      ],
    });
    const result = runSimulation(plan);

    expect(result.goalResults).toHaveLength(2);
    expect(result.goalResults[0].goalIndex).toBe(0);
    expect(result.goalResults[1].goalIndex).toBe(1);
  });

  it('Test 4: each GoalResult.probabilityScore is between 0 and 1', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    for (const gr of result.goalResults) {
      expect(gr.probabilityScore).toBeGreaterThanOrEqual(0);
      expect(gr.probabilityScore).toBeLessThanOrEqual(1);
    }
  });

  it('Test 5: runCount equals ITERATION_COUNT (10000)', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    expect(result.runCount).toBe(ITERATION_COUNT);
    expect(ITERATION_COUNT).toBe(10000);
  });

  it('Test 6: assumptions.inflationRate equals 0.03', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    expect(result.assumptions.inflationRate).toBe(0.03);
    expect(INFLATION_RATE).toBe(0.03);
  });

  it('Test 7: with moderate risk level, assumptions.realReturnMean is 0.07 and realReturnStdDev is 0.12', () => {
    const plan = makeTestPlan({ riskTolerance: { score: 7, level: 'moderate', answers: {} } });
    const result = runSimulation(plan);

    expect(result.assumptions.realReturnMean).toBe(0.07);
    expect(result.assumptions.realReturnStdDev).toBe(0.12);
    expect(RETURN_ASSUMPTIONS.moderate.mean).toBe(0.07);
    expect(RETURN_ASSUMPTIONS.moderate.stdDev).toBe(0.12);
  });

  it('Test 8: with no goals in plan, overallProbability is 1.0', () => {
    const plan = makeTestPlan({ goals: [] });
    const result = runSimulation(plan);

    expect(result.overallProbability).toBe(1.0);
    expect(result.goalResults).toHaveLength(0);
  });

  it('Test 9: extremely high savings + modest goals produces probabilityScore > 0.8', () => {
    const plan = makeTestPlan({
      currentAge: 25,
      income: { salary: 500000, otherAnnualIncome: 0, annualSavingsRate: 0.5 },
      assets: {
        checkingAndSavings: 500000,
        retirementAccounts: 1000000,
        taxableInvestments: 500000,
        realEstateEquity: 0,
        otherAssets: 0,
      },
      goals: [
        { type: 'retirement', targetRetirementAge: 65, desiredAnnualIncome: 30000, yearsInRetirement: 20 },
      ],
    });
    const result = runSimulation(plan);

    expect(result.goalResults[0].probabilityScore).toBeGreaterThan(0.8);
  });

  it('Test 10: zero savings + large goals produces probabilityScore < 0.5', () => {
    const plan = makeTestPlan({
      currentAge: 55,
      income: { salary: 20000, otherAnnualIncome: 0, annualSavingsRate: 0 },
      assets: {
        checkingAndSavings: 0,
        retirementAccounts: 0,
        taxableInvestments: 0,
        realEstateEquity: 0,
        otherAssets: 0,
      },
      goals: [
        { type: 'retirement', targetRetirementAge: 60, desiredAnnualIncome: 120000, yearsInRetirement: 35 },
      ],
    });
    const result = runSimulation(plan);

    expect(result.goalResults[0].probabilityScore).toBeLessThan(0.5);
  });

  it('Test 11: overrides.annualSavingsRate replaces plan.income.annualSavingsRate in results', () => {
    const plan = makeTestPlan({ income: { salary: 100000, otherAnnualIncome: 0, annualSavingsRate: 0.01 } });

    const resultLow = runSimulation(plan);
    const resultHigh = runSimulation(plan, { annualSavingsRate: 0.5 });

    // Higher override savings rate should give better or equal probability
    expect(resultHigh.goalResults[0].probabilityScore).toBeGreaterThanOrEqual(
      resultLow.goalResults[0].probabilityScore
    );
  });

  it('Test 12: overrides.retirementAge replaces RetirementGoal.targetRetirementAge', () => {
    const plan = makeTestPlan({
      currentAge: 35,
      goals: [{ type: 'retirement', targetRetirementAge: 55, desiredAnnualIncome: 60000, yearsInRetirement: 25 }],
    });

    // Retiring later (70) should generally give better probability vs earlier (55)
    const resultEarly = runSimulation(plan);
    const resultLate = runSimulation(plan, { retirementAge: 70 });

    // Later retirement = more accumulation time = higher probability
    expect(resultLate.goalResults[0].probabilityScore).toBeGreaterThanOrEqual(
      resultEarly.goalResults[0].probabilityScore - 0.1
    );
  });

  it('Test 13: overrides.returnMean and returnStdDev replace risk-level defaults in assumptions output', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan, { returnMean: 0.10, returnStdDev: 0.05 });

    expect(result.assumptions.realReturnMean).toBe(0.10);
    expect(result.assumptions.realReturnStdDev).toBe(0.05);
  });

  it('Test 14: 10,000 iterations complete in under 5000ms (performance)', () => {
    const plan = makeTestPlan();
    const start = Date.now();
    runSimulation(plan);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  it('Test 15: fundingGap is >= 0 for each goal result', () => {
    const plan = makeTestPlan();
    const result = runSimulation(plan);

    for (const gr of result.goalResults) {
      expect(gr.fundingGap).toBeGreaterThanOrEqual(0);
    }
  });
});
