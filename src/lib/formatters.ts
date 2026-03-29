// src/lib/formatters.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatGoalType(type: string): string {
  switch (type) {
    case 'retirement': return 'Retirement';
    case 'purchase': return 'Major Purchase';
    case 'education': return 'Education';
    case 'legacy': return 'Legacy / Estate';
    default: return type;
  }
}
