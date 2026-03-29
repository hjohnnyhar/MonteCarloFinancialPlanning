export interface RiskQuestion {
  id: string;
  text: string;
  options: { label: string; value: number }[];
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'time_horizon',
    text: 'When do you expect to need most of this money?',
    options: [
      { label: 'Less than 2 years', value: 1 },
      { label: '2-10 years', value: 2 },
      { label: 'More than 10 years', value: 3 },
    ],
  },
  {
    id: 'loss_reaction',
    text: 'If your portfolio dropped 20% in one year, you would:',
    options: [
      { label: 'Sell everything', value: 1 },
      { label: 'Hold and wait', value: 2 },
      { label: 'Buy more', value: 3 },
    ],
  },
  {
    id: 'income_stability',
    text: 'How stable is your income?',
    options: [
      { label: 'Variable / uncertain', value: 1 },
      { label: 'Somewhat stable', value: 2 },
      { label: 'Very stable', value: 3 },
    ],
  },
  {
    id: 'goal_priority',
    text: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve capital', value: 1 },
      { label: 'Balance growth and safety', value: 2 },
      { label: 'Maximize long-term growth', value: 3 },
    ],
  },
];

export function scoreFromAnswers(answers: Record<string, number>): number {
  const total = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const max = RISK_QUESTIONS.length * 3;
  return Math.round((total / max) * 9) + 1;
}

export function deriveRiskLevel(score: number): 'conservative' | 'moderate' | 'aggressive' {
  if (score <= 5) return 'conservative';
  if (score <= 9) return 'moderate';
  return 'aggressive';
}
