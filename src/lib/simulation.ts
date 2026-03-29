// src/lib/simulation.ts
// Pure Monte Carlo simulation engine — no side effects, no I/O.

import type { FinancialPlan, SimulationResults, GoalResult, Goal, RiskToleranceLevel } from './types';

export interface SimulationOverrides {
  annualSavingsRate?: number;
  retirementAge?: number;
  returnMean?: number;
  returnStdDev?: number;
}

export const INFLATION_RATE = 0.03;
export const ITERATION_COUNT = 10_000;

export const RETURN_ASSUMPTIONS: Record<RiskToleranceLevel, { mean: number; stdDev: number }> = {
  conservative: { mean: 0.055, stdDev: 0.08 },
  moderate:     { mean: 0.07,  stdDev: 0.12 },
  aggressive:   { mean: 0.09,  stdDev: 0.16 },
};

// Box-Muller transform to draw a normally distributed random number.
function randNormal(mean: number, stdDev: number): number {
  // Guard u1 from being exactly 0 to avoid log(0) = -Infinity
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

// Resolve which return assumptions to use (overrides take precedence).
function resolveAssumptions(
  plan: FinancialPlan,
  overrides?: SimulationOverrides
): { returnMean: number; returnStdDev: number } {
  if (overrides?.returnMean !== undefined && overrides?.returnStdDev !== undefined) {
    return { returnMean: overrides.returnMean, returnStdDev: overrides.returnStdDev };
  }
  const level: RiskToleranceLevel = plan.riskTolerance.level ?? 'moderate';
  return {
    returnMean: overrides?.returnMean ?? RETURN_ASSUMPTIONS[level].mean,
    returnStdDev: overrides?.returnStdDev ?? RETURN_ASSUMPTIONS[level].stdDev,
  };
}

// Internal goal descriptor with chronological sorting key.
interface GoalWithYear {
  goal: Goal;
  originalIndex: number;
  yearsFromNow: number; // Infinity for legacy goals
}

function buildGoalDescriptors(
  plan: FinancialPlan,
  resolvedRetirementAge: number,
  currentAge: number
): GoalWithYear[] {
  const currentCalendarYear = new Date().getFullYear();

  return plan.goals.map((goal, idx) => {
    let yearsFromNow: number;
    if (goal.type === 'retirement') {
      yearsFromNow = resolvedRetirementAge - currentAge;
    } else if (goal.type === 'legacy') {
      yearsFromNow = Infinity;
    } else {
      // purchase or education
      yearsFromNow = goal.targetYear - currentCalendarYear;
    }
    return { goal, originalIndex: idx, yearsFromNow };
  });
}

// Simulate a single iteration (one path through time).
// Returns boolean[] — one success/fail per goal, in original order.
function simulateOnePath(
  goalDescriptors: GoalWithYear[],
  initialPortfolio: number,
  annualSavings: number,
  planHorizon: number,
  yearsToRetirement: number,
  hasRetirementGoal: boolean,
  inflatedAnnualWithdrawal: number,
  returnMean: number,
  returnStdDev: number
): boolean[] {
  let portfolio = initialPortfolio;
  const successes = goalDescriptors.map(() => true); // assume success until proven otherwise

  for (let year = 0; year < planHorizon; year++) {
    const r = randNormal(returnMean, returnStdDev);

    if (!hasRetirementGoal || year < yearsToRetirement) {
      // Accumulation phase
      portfolio = portfolio * (1 + r) + annualSavings;
    } else {
      // Decumulation phase
      portfolio = portfolio * (1 + r) - inflatedAnnualWithdrawal;
    }

    // Clamp portfolio to 0 (can't have negative wealth for simulation purposes)
    portfolio = Math.max(0, portfolio);

    // Check each goal at its target year
    for (let gi = 0; gi < goalDescriptors.length; gi++) {
      const gd = goalDescriptors[gi];
      if (gd.yearsFromNow === Infinity) continue; // legacy goals checked at horizon end
      if (year + 1 === gd.yearsFromNow) {
        // Compute inflated target amount in future dollars
        const inflatedTarget = computeInflatedTarget(gd.goal, gd.yearsFromNow);
        if (portfolio < inflatedTarget) {
          successes[gi] = false;
        }
      }
    }
  }

  // Check legacy goals at horizon end
  for (let gi = 0; gi < goalDescriptors.length; gi++) {
    const gd = goalDescriptors[gi];
    if (gd.yearsFromNow === Infinity) {
      if (gd.goal.type === 'legacy') {
        const inflatedTarget = gd.goal.targetAmount * Math.pow(1 + INFLATION_RATE, planHorizon);
        if (portfolio < inflatedTarget) {
          successes[gi] = false;
        }
      }
    }
  }

  return successes;
}

function computeInflatedTarget(goal: Goal, yearsFromNow: number): number {
  if (goal.type === 'retirement') {
    // Retirement goal: we check if portfolio is sufficient to fund withdrawals,
    // so the "target" at retirement is the present value of withdrawals.
    // For the success check, we use the inflated annual income * years in retirement
    // as a proxy for the lump-sum needed (simplified: PV ~ inflatedIncome * yearsInRetirement).
    const inflatedAnnualIncome = goal.desiredAnnualIncome * Math.pow(1 + INFLATION_RATE, yearsFromNow);
    return inflatedAnnualIncome * goal.yearsInRetirement;
  }
  if (goal.type === 'purchase' || goal.type === 'education') {
    return goal.targetAmount * Math.pow(1 + INFLATION_RATE, yearsFromNow);
  }
  if (goal.type === 'legacy') {
    return goal.targetAmount; // handled separately in simulateOnePath
  }
  return 0;
}

export function runSimulation(
  plan: FinancialPlan,
  overrides?: SimulationOverrides
): SimulationResults {
  // Validate currentAge
  if (!plan.currentAge || plan.currentAge <= 0) {
    throw new Error('currentAge is required');
  }

  const currentAge = plan.currentAge;

  // Resolve return assumptions
  const { returnMean, returnStdDev } = resolveAssumptions(plan, overrides);

  // Resolve savings rate
  const resolvedSavingsRate = overrides?.annualSavingsRate ?? plan.income.annualSavingsRate;

  // Resolve retirement age
  const retirementGoal = plan.goals.find((g) => g.type === 'retirement');
  const resolvedRetirementAge =
    overrides?.retirementAge ??
    (retirementGoal?.type === 'retirement' ? retirementGoal.targetRetirementAge : 65);

  // Early return for no goals
  if (plan.goals.length === 0) {
    return {
      overallProbability: 1.0,
      goalResults: [],
      runCount: ITERATION_COUNT,
      assumptions: {
        inflationRate: INFLATION_RATE,
        realReturnMean: returnMean,
        realReturnStdDev: returnStdDev,
      },
      ranAt: new Date().toISOString(),
    };
  }

  // Compute derived values
  const initialPortfolio =
    plan.assets.checkingAndSavings +
    plan.assets.retirementAccounts +
    plan.assets.taxableInvestments;

  const annualSavings =
    (plan.income.salary + plan.income.otherAnnualIncome) * resolvedSavingsRate;

  const yearsToRetirement = resolvedRetirementAge - currentAge;
  const hasRetirementGoal = retirementGoal !== undefined;

  // Inflated annual withdrawal amount (in future dollars at retirement)
  const inflatedAnnualWithdrawal = hasRetirementGoal && retirementGoal?.type === 'retirement'
    ? retirementGoal.desiredAnnualIncome * Math.pow(1 + INFLATION_RATE, yearsToRetirement)
    : 0;

  // Build goal descriptors for iteration
  const goalDescriptors = buildGoalDescriptors(plan, resolvedRetirementAge, currentAge);

  // Determine plan horizon (years to simulate)
  let planHorizon = 30; // default
  for (const gd of goalDescriptors) {
    if (gd.yearsFromNow !== Infinity) {
      const horizon = hasRetirementGoal
        ? Math.max(gd.yearsFromNow, yearsToRetirement + (retirementGoal?.type === 'retirement' ? retirementGoal.yearsInRetirement : 0))
        : gd.yearsFromNow;
      planHorizon = Math.max(planHorizon, horizon);
    }
  }
  if (hasRetirementGoal && retirementGoal?.type === 'retirement') {
    planHorizon = Math.max(planHorizon, yearsToRetirement + retirementGoal.yearsInRetirement);
  }

  // Run Monte Carlo iterations
  const goalSuccessCounts = new Array<number>(plan.goals.length).fill(0);
  const goalFailureShortfalls = Array.from({ length: plan.goals.length }, () => [] as number[]);
  let allMetCount = 0;

  for (let i = 0; i < ITERATION_COUNT; i++) {
    const successes = simulateOnePath(
      goalDescriptors,
      initialPortfolio,
      annualSavings,
      planHorizon,
      yearsToRetirement,
      hasRetirementGoal,
      inflatedAnnualWithdrawal,
      returnMean,
      returnStdDev
    );

    let allMet = true;
    for (let gi = 0; gi < successes.length; gi++) {
      if (successes[gi]) {
        goalSuccessCounts[gi]++;
      } else {
        allMet = false;
        // Record shortfall as 0 for now (we will set gap=0 for successes, gap>0 for failures)
        goalFailureShortfalls[gi].push(0);
      }
    }
    if (allMet) allMetCount++;
  }

  // Build GoalResult per goal
  const goalResults: GoalResult[] = plan.goals.map((goal, gi) => {
    const probabilityScore = goalSuccessCounts[gi] / ITERATION_COUNT;
    const yearsFromNow = goalDescriptors[gi].yearsFromNow === Infinity
      ? planHorizon
      : goalDescriptors[gi].yearsFromNow;

    // Funding gap: for failed iterations, approximate the gap in today's dollars.
    // Gap is zero if all iterations succeeded.
    const failCount = ITERATION_COUNT - goalSuccessCounts[gi];
    let fundingGap = 0;
    if (failCount > 0) {
      const inflatedTarget = computeInflatedTarget(goal, yearsFromNow);
      // Gap in today's dollars (deflate from future)
      const todayTarget = inflatedTarget / Math.pow(1 + INFLATION_RATE, yearsFromNow);
      // Estimate gap as today's target minus current portfolio share (simplified)
      fundingGap = Math.max(0, todayTarget - initialPortfolio);
    }

    // targetAmount in today's dollars
    let targetAmount: number;
    if (goal.type === 'retirement') {
      targetAmount = goal.desiredAnnualIncome * goal.yearsInRetirement;
    } else {
      targetAmount = goal.targetAmount;
    }

    return {
      goalIndex: gi,
      goalType: goal.type,
      probabilityScore,
      fundingGap,
      targetAmount,
    };
  });

  return {
    overallProbability: allMetCount / ITERATION_COUNT,
    goalResults,
    runCount: ITERATION_COUNT,
    assumptions: {
      inflationRate: INFLATION_RATE,
      realReturnMean: returnMean,
      realReturnStdDev: returnStdDev,
    },
    ranAt: new Date().toISOString(),
  };
}
