// src/lib/simulation.ts
// Pure Monte Carlo simulation engine — no side effects, no I/O.

import type { FinancialPlan, SimulationResults, GoalResult, Goal, RiskToleranceLevel, Recommendation, YearlySnapshot, ScoreTier } from './types';

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

// Number of iterations used for lightweight re-simulation (recommendations + median path).
const RECOMMENDATION_ITER = 2_000;
const MEDIAN_PATH_ITER = 1_000;

// Compute score tier based on probability thresholds (D-04).
export function computeScoreTier(probability: number): ScoreTier {
  if (probability >= 0.8) return { label: 'Strong plan', color: 'green' };
  if (probability >= 0.6) return { label: 'On track', color: 'amber' };
  return { label: 'At risk', color: 'red' };
}

// Run a lightweight simulation (fewer iterations) and return overall probability.
function runLightweightSim(
  plan: FinancialPlan,
  overrides: SimulationOverrides,
  iterations: number
): number {
  const { returnMean, returnStdDev } = resolveAssumptions(plan, overrides);
  const resolvedSavingsRate = overrides?.annualSavingsRate ?? plan.income.annualSavingsRate;
  const retirementGoal = plan.goals.find((g) => g.type === 'retirement');
  const resolvedRetirementAge =
    overrides?.retirementAge ??
    (retirementGoal?.type === 'retirement' ? retirementGoal.targetRetirementAge : 65);

  if (plan.goals.length === 0) return 1.0;

  const initialPortfolio =
    plan.assets.checkingAndSavings +
    plan.assets.retirementAccounts +
    plan.assets.taxableInvestments;

  const annualSavings =
    (plan.income.salary + plan.income.otherAnnualIncome) * resolvedSavingsRate;

  const currentAge = plan.currentAge;
  const yearsToRetirement = resolvedRetirementAge - currentAge;
  const hasRetirementGoal = retirementGoal !== undefined;

  const inflatedAnnualWithdrawal = hasRetirementGoal && retirementGoal?.type === 'retirement'
    ? retirementGoal.desiredAnnualIncome * Math.pow(1 + INFLATION_RATE, yearsToRetirement)
    : 0;

  const goalDescriptors = buildGoalDescriptors(plan, resolvedRetirementAge, currentAge);

  let planHorizon = 30;
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

  let allMetCount = 0;
  for (let i = 0; i < iterations; i++) {
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
    if (successes.every(Boolean)) allMetCount++;
  }

  return allMetCount / iterations;
}

// Compute up to 3 actionable recommendations sorted by impact (D-06, D-07).
export function computeRecommendations(
  plan: FinancialPlan,
  baseResults: { overallProbability: number; goalResults: Array<{ goalIndex: number; probabilityScore: number }> },
  overrides?: SimulationOverrides
): Recommendation[] {
  const baseSavingsRate = overrides?.annualSavingsRate ?? plan.income.annualSavingsRate;
  const baseRetirementAge =
    overrides?.retirementAge ??
    (plan.goals.find((g) => g.type === 'retirement')?.type === 'retirement'
      ? (plan.goals.find((g) => g.type === 'retirement') as { targetRetirementAge: number }).targetRetirementAge
      : null);

  const candidates: Recommendation[] = [];

  // Lever 1: Savings rate increase — find rate that reaches 90%+ (or best achievable).
  // Try +5pp increments up to 40pp above current rate (cap at 0.8 max savings rate).
  {
    const currentAnnualSavings = (plan.income.salary + plan.income.otherAnnualIncome) * baseSavingsRate;
    let bestRate = baseSavingsRate;
    let bestScore = baseResults.overallProbability;
    const maxRate = Math.min(0.8, baseSavingsRate + 0.4);
    for (let delta = 0.05; baseSavingsRate + delta <= maxRate + 0.001; delta += 0.05) {
      const trialRate = Math.min(0.8, baseSavingsRate + delta);
      const score = runLightweightSim(plan, { ...overrides, annualSavingsRate: trialRate }, RECOMMENDATION_ITER);
      if (score > bestScore) {
        bestScore = score;
        bestRate = trialRate;
        if (score >= 0.9) break; // found a rate that achieves target
      }
    }
    if (bestRate > baseSavingsRate) {
      const suggestedAnnualSavings = (plan.income.salary + plan.income.otherAnnualIncome) * bestRate;
      candidates.push({
        lever: 'savings_increase',
        summary: `Increase savings rate from ${Math.round(baseSavingsRate * 100)}% to ${Math.round(bestRate * 100)}% (${currencyStr(suggestedAnnualSavings - currentAnnualSavings)} more per year)`,
        currentValue: currentAnnualSavings,
        suggestedValue: suggestedAnnualSavings,
        projectedScore: bestScore,
      });
    }
  }

  // Lever 2: Retirement delay — only if plan has a retirement goal.
  if (baseRetirementAge !== null) {
    let bestAge = baseRetirementAge;
    let bestScore = baseResults.overallProbability;
    for (const delta of [1, 2, 3]) {
      const trialAge = baseRetirementAge + delta;
      const score = runLightweightSim(plan, { ...overrides, retirementAge: trialAge }, RECOMMENDATION_ITER);
      if (score > bestScore) {
        bestScore = score;
        bestAge = trialAge;
        if (score >= 0.9) break;
      }
    }
    if (bestAge > baseRetirementAge) {
      candidates.push({
        lever: 'retirement_delay',
        summary: `Delay retirement from age ${baseRetirementAge} to ${bestAge} (+${bestAge - baseRetirementAge} year${bestAge - baseRetirementAge > 1 ? 's' : ''})`,
        currentValue: baseRetirementAge,
        suggestedValue: bestAge,
        projectedScore: bestScore,
      });
    }
  }

  // Lever 3: Monthly spending reduction — reduce monthly discretionary by 20%.
  {
    const currentMonthly = plan.expenses.monthlyDiscretionary;
    const reducedMonthly = currentMonthly * 0.8; // 20% reduction
    const annualSaved = (currentMonthly - reducedMonthly) * 12;
    // Model this as savings increase (money freed up from spending goes to savings)
    const newSavingsRate = Math.min(
      0.8,
      baseSavingsRate + annualSaved / (plan.income.salary + plan.income.otherAnnualIncome || 1)
    );
    const score = runLightweightSim(plan, { ...overrides, annualSavingsRate: newSavingsRate }, RECOMMENDATION_ITER);
    if (score > baseResults.overallProbability && currentMonthly > 0) {
      candidates.push({
        lever: 'spending_reduction',
        summary: `Reduce monthly discretionary spending by 20% (${currencyStr(annualSaved)} freed per year)`,
        currentValue: currentMonthly,
        suggestedValue: reducedMonthly,
        projectedScore: score,
      });
    }
  }

  // Lever 4: Goal target reduction — reduce the worst-funded goal's target by 20%.
  {
    if (baseResults.goalResults.length > 0) {
      const worstGoalResult = baseResults.goalResults.reduce((a, b) =>
        a.probabilityScore < b.probabilityScore ? a : b
      );
      const worstGoal = plan.goals[worstGoalResult.goalIndex];
      if (worstGoal && worstGoal.type !== 'retirement') {
        const currentTarget = worstGoal.targetAmount;
        const reducedTarget = currentTarget * 0.8;
        // Build a modified plan with reduced target for the worst goal
        const modifiedGoals = plan.goals.map((g, i) => {
          if (i === worstGoalResult.goalIndex && g.type !== 'retirement') {
            return { ...g, targetAmount: reducedTarget } as typeof g;
          }
          return g;
        });
        const modifiedPlan = { ...plan, goals: modifiedGoals };
        const score = runLightweightSim(modifiedPlan, { ...overrides }, RECOMMENDATION_ITER);
        if (score > baseResults.overallProbability) {
          const label = worstGoal.type === 'purchase' ? worstGoal.description
            : worstGoal.type === 'education' ? `education (${worstGoal.beneficiary})`
            : 'goal';
          candidates.push({
            lever: 'goal_reduction',
            summary: `Reduce ${label} target by 20% (from ${currencyStr(currentTarget)} to ${currencyStr(reducedTarget)})`,
            currentValue: currentTarget,
            suggestedValue: reducedTarget,
            projectedScore: score,
          });
        }
      }
    }
  }

  // Sort by impact (highest projectedScore first) and return top 3.
  return candidates
    .sort((a, b) => b.projectedScore - a.projectedScore)
    .slice(0, 3);
}

// Format a dollar amount as a currency string for recommendation summaries.
function currencyStr(amount: number): string {
  return `$${Math.round(Math.abs(amount)).toLocaleString()}`;
}

// Extract the median portfolio path across 1,000 iterations (D-09, D-10, D-12).
export function extractMedianPath(
  plan: FinancialPlan,
  overrides?: SimulationOverrides
): YearlySnapshot[] {
  const { returnMean, returnStdDev } = resolveAssumptions(plan, overrides);
  const resolvedSavingsRate = overrides?.annualSavingsRate ?? plan.income.annualSavingsRate;
  const retirementGoal = plan.goals.find((g) => g.type === 'retirement');
  const resolvedRetirementAge =
    overrides?.retirementAge ??
    (retirementGoal?.type === 'retirement' ? retirementGoal.targetRetirementAge : 65);

  const currentAge = plan.currentAge;
  const yearsToRetirement = resolvedRetirementAge - currentAge;
  const hasRetirementGoal = retirementGoal !== undefined;

  const annualSavings =
    (plan.income.salary + plan.income.otherAnnualIncome) * resolvedSavingsRate;

  const inflatedAnnualWithdrawal = hasRetirementGoal && retirementGoal?.type === 'retirement'
    ? retirementGoal.desiredAnnualIncome * Math.pow(1 + INFLATION_RATE, yearsToRetirement)
    : 0;

  const goalDescriptors = buildGoalDescriptors(plan, resolvedRetirementAge, currentAge);

  let planHorizon = 30;
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

  const initialPortfolio =
    plan.assets.checkingAndSavings +
    plan.assets.retirementAccounts +
    plan.assets.taxableInvestments;

  // Collect portfolio value at each year across all iterations.
  // yearPortfolios[year] = array of portfolio values across iterations
  const yearPortfolios: number[][] = Array.from({ length: planHorizon }, () => []);

  for (let i = 0; i < MEDIAN_PATH_ITER; i++) {
    let portfolio = initialPortfolio;
    for (let year = 0; year < planHorizon; year++) {
      const r = randNormal(returnMean, returnStdDev);
      if (!hasRetirementGoal || year < yearsToRetirement) {
        portfolio = portfolio * (1 + r) + annualSavings;
      } else {
        portfolio = portfolio * (1 + r) - inflatedAnnualWithdrawal;
      }
      portfolio = Math.max(0, portfolio);
      yearPortfolios[year].push(portfolio);
    }
  }

  // Build goal milestone map: yearsFromNow -> description
  const currentCalendarYear = new Date().getFullYear();
  const milestonesAtYear: Map<number, string> = new Map();
  for (const gd of goalDescriptors) {
    const yr = gd.yearsFromNow === Infinity ? planHorizon : gd.yearsFromNow;
    let label: string;
    if (gd.goal.type === 'retirement') {
      label = `Retirement at age ${resolvedRetirementAge}`;
    } else if (gd.goal.type === 'purchase') {
      label = `Purchase: ${gd.goal.description}`;
    } else if (gd.goal.type === 'education') {
      label = `Education: ${gd.goal.beneficiary}`;
    } else {
      label = 'Legacy goal';
    }
    const existing = milestonesAtYear.get(yr);
    milestonesAtYear.set(yr, existing ? `${existing}, ${label}` : label);
  }

  // Build median snapshots
  return Array.from({ length: planHorizon }, (_, yearIdx) => {
    const portfolios = yearPortfolios[yearIdx].slice().sort((a, b) => a - b);
    const mid = Math.floor(portfolios.length / 2);
    const medianPortfolio = portfolios.length % 2 === 0
      ? (portfolios[mid - 1] + portfolios[mid]) / 2
      : portfolios[mid];

    const isAccumulation = !hasRetirementGoal || yearIdx < yearsToRetirement;

    return {
      year: currentCalendarYear + yearIdx + 1,
      age: currentAge + yearIdx + 1,
      portfolioValue: Math.round(medianPortfolio),
      annualSavings: isAccumulation ? annualSavings : 0,
      annualWithdrawal: isAccumulation ? 0 : inflatedAnnualWithdrawal,
      goalMilestone: milestonesAtYear.get(yearIdx + 1) ?? null,
    };
  });
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

  const overallProbability = allMetCount / ITERATION_COUNT;

  // Compute score tier, recommendations, and median path
  const scoreTier = computeScoreTier(overallProbability);
  const partialResults = { overallProbability, goalResults };
  const recommendations = computeRecommendations(plan, partialResults, overrides);
  const yearlyProjection = extractMedianPath(plan, overrides);

  return {
    overallProbability,
    goalResults,
    runCount: ITERATION_COUNT,
    assumptions: {
      inflationRate: INFLATION_RATE,
      realReturnMean: returnMean,
      realReturnStdDev: returnStdDev,
    },
    ranAt: new Date().toISOString(),
    scoreTier,
    recommendations,
    yearlyProjection,
  };
}
