// src/components/pdf/FinancialPlanReport.tsx
// react-pdf Document component — runs in worker context, no Tailwind, no DOM APIs

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type { FinancialPlan, SimulationResults } from '@/lib/types';

// -------------------------------------------------------------------
// Currency formatter that works without Intl (react-pdf worker context)
// -------------------------------------------------------------------
function formatPdfCurrency(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString();
  let formatted = '';
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) formatted += ',';
    formatted += str[i];
  }
  return (amount < 0 ? '-$' : '$') + formatted;
}

function formatGoalTypePdf(type: string): string {
  switch (type) {
    case 'retirement': return 'Retirement';
    case 'purchase': return 'Major Purchase';
    case 'education': return 'Education';
    case 'legacy': return 'Legacy / Estate';
    default: return type;
  }
}

// -------------------------------------------------------------------
// Color tokens (hex equivalents of Tailwind color tokens used in app)
// -------------------------------------------------------------------
const COLORS = {
  green:   '#16a34a', // green-600
  amber:   '#d97706', // amber-600
  red:     '#dc2626', // red-600
  gray900: '#111827', // gray-900
  gray700: '#374151', // gray-700
  gray500: '#6b7280', // gray-500
  gray300: '#d1d5db', // gray-300
  gray100: '#f3f4f6', // gray-100
  blue600: '#2563eb', // blue-600
  white:   '#ffffff',
} as const;

// -------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.gray900,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
  },

  // ---- Header ----
  titleSection: {
    marginBottom: 20,
    borderBottom: `1pt solid ${COLORS.gray300}`,
    paddingBottom: 12,
  },
  reportTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 9,
    color: COLORS.gray500,
  },

  // ---- Section ----
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
    marginBottom: 8,
    borderBottom: `1pt solid ${COLORS.gray300}`,
    paddingBottom: 4,
  },

  // ---- Headline score ----
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 10,
  },
  scoreBig: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  tierLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 10,
    color: COLORS.gray700,
    marginBottom: 4,
  },

  // ---- Plan summary ----
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  summaryLabel: {
    width: 160,
    fontSize: 10,
    color: COLORS.gray500,
  },
  summaryValue: {
    flex: 1,
    fontSize: 10,
    color: COLORS.gray900,
    fontFamily: 'Helvetica-Bold',
  },

  // ---- Tables ----
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderBottom: `1pt solid ${COLORS.gray300}`,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.gray300}`,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  tableRowHighlight: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.gray300}`,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    backgroundColor: '#fef3c7', // amber-100 equivalent
  },
  cellText: {
    fontSize: 9,
    color: COLORS.gray900,
  },
  headerText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray700,
  },

  // Goal breakdown column widths
  colGoalType: { width: 110 },
  colTarget:   { width: 90 },
  colProb:     { width: 60 },
  colGap:      { flex: 1 },

  // Recommendations
  recItem: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeft: `3pt solid ${COLORS.blue600}`,
  },
  recNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.blue600,
    marginBottom: 2,
  },
  recSummary: {
    fontSize: 10,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  recDetail: {
    fontSize: 9,
    color: COLORS.gray500,
  },

  // Projection table column widths
  colYear:       { width: 36 },
  colAge:        { width: 30 },
  colPortfolio:  { width: 80 },
  colSavings:    { width: 72 },
  colWithdrawal: { width: 72 },
  colMilestone:  { flex: 1 },
});

// -------------------------------------------------------------------
// Helper: probability color
// -------------------------------------------------------------------
function probColor(p: number): string {
  if (p >= 0.8) return COLORS.green;
  if (p >= 0.6) return COLORS.amber;
  return COLORS.red;
}

function tierColor(color?: 'green' | 'amber' | 'red'): string {
  if (color === 'green') return COLORS.green;
  if (color === 'amber') return COLORS.amber;
  if (color === 'red')   return COLORS.red;
  return COLORS.gray900;
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
interface FinancialPlanReportProps {
  plan: FinancialPlan;
  results: SimulationResults;
}

export function FinancialPlanReport({ plan, results }: FinancialPlanReportProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const overallPct = Math.round(results.overallProbability * 100);
  const totalAssets =
    plan.assets.checkingAndSavings +
    plan.assets.retirementAccounts +
    plan.assets.taxableInvestments +
    plan.assets.realEstateEquity +
    plan.assets.otherAssets;
  const savingsRatePct = Math.round(plan.income.annualSavingsRate * 100);

  return (
    <Document>
      {/* ========================================================= Page 1 */}
      <Page size="LETTER" style={styles.page}>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.reportTitle}>Financial Plan Report</Text>
          <Text style={styles.reportDate}>Generated: {generatedDate}</Text>
        </View>

        {/* Headline Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Probability of Success</Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreBig, { color: tierColor(results.scoreTier?.color) }]}>
              {overallPct}%
            </Text>
          </View>
          {results.scoreTier && (
            <Text style={[styles.tierLabel, { color: tierColor(results.scoreTier.color) }]}>
              {results.scoreTier.label}
            </Text>
          )}
          <Text style={styles.explanationText}>
            Your plan has a {overallPct}% probability of meeting all financial goals across{' '}
            {results.runCount.toLocaleString()} simulated scenarios.
          </Text>
        </View>

        {/* Plan Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Summary</Text>
          {plan.people.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Primary Person</Text>
              <Text style={styles.summaryValue}>{plan.people[0].name || 'Unnamed'}</Text>
            </View>
          )}
          {plan.people.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Annual Income</Text>
              <Text style={styles.summaryValue}>
                {formatPdfCurrency(plan.people.reduce((sum, p) => sum + p.annualSalary + p.otherAnnualIncome, 0))}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Savings Rate</Text>
            <Text style={styles.summaryValue}>{savingsRatePct}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Investable Assets</Text>
            <Text style={styles.summaryValue}>{formatPdfCurrency(totalAssets)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Risk Tolerance</Text>
            <Text style={styles.summaryValue}>
              {plan.riskTolerance.level
                ? plan.riskTolerance.level.charAt(0).toUpperCase() + plan.riskTolerance.level.slice(1)
                : 'Not set'}
            </Text>
          </View>
        </View>

        {/* Goal Breakdown */}
        {results.goalResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Breakdown</Text>
            {/* Header row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colGoalType]}>Goal Type</Text>
              <Text style={[styles.headerText, styles.colTarget]}>Target Amount</Text>
              <Text style={[styles.headerText, styles.colProb]}>Probability</Text>
              <Text style={[styles.headerText, styles.colGap]}>Funding Gap</Text>
            </View>
            {results.goalResults.map((goal) => (
              <View key={goal.goalIndex} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colGoalType]}>
                  {formatGoalTypePdf(goal.goalType)}
                </Text>
                <Text style={[styles.cellText, styles.colTarget]}>
                  {formatPdfCurrency(goal.targetAmount)}
                </Text>
                <Text style={[styles.cellText, styles.colProb, { color: probColor(goal.probabilityScore) }]}>
                  {Math.round(goal.probabilityScore * 100)}%
                </Text>
                <Text style={[styles.cellText, styles.colGap, { color: goal.fundingGap > 0 ? COLORS.amber : COLORS.green }]}>
                  {goal.fundingGap > 0 ? formatPdfCurrency(goal.fundingGap) : 'None'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {results.recommendations && results.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {results.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <Text style={styles.recNumber}>Recommendation {idx + 1}</Text>
                <Text style={styles.recSummary}>{rec.summary}</Text>
                <Text style={styles.recDetail}>
                  Current: {formatPdfCurrency(rec.currentValue)}
                  {'  '}Suggested: {formatPdfCurrency(rec.suggestedValue)}
                  {'  '}Projected score: {Math.round(rec.projectedScore * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>

      {/* ========================================================= Page 2: Projection */}
      {results.yearlyProjection && results.yearlyProjection.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>Year-by-Year Projection</Text>
            <Text style={styles.reportDate}>
              Median portfolio path across {results.runCount.toLocaleString()} simulations
            </Text>
          </View>

          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colYear]}>Year</Text>
            <Text style={[styles.headerText, styles.colAge]}>Age</Text>
            <Text style={[styles.headerText, styles.colPortfolio]}>Portfolio Value</Text>
            <Text style={[styles.headerText, styles.colSavings]}>Savings</Text>
            <Text style={[styles.headerText, styles.colWithdrawal]}>Withdrawals</Text>
            <Text style={[styles.headerText, styles.colMilestone]}>Milestone</Text>
          </View>

          {results.yearlyProjection.map((row, idx) => (
            <View
              key={idx}
              style={row.goalMilestone ? styles.tableRowHighlight : styles.tableRow}
              wrap={false}
            >
              <Text style={[styles.cellText, styles.colYear]}>{row.year}</Text>
              <Text style={[styles.cellText, styles.colAge]}>{row.age}</Text>
              <Text style={[styles.cellText, styles.colPortfolio]}>
                {formatPdfCurrency(row.portfolioValue)}
              </Text>
              <Text style={[styles.cellText, styles.colSavings]}>
                {row.annualSavings > 0 ? formatPdfCurrency(row.annualSavings) : '—'}
              </Text>
              <Text style={[styles.cellText, styles.colWithdrawal]}>
                {row.annualWithdrawal > 0 ? formatPdfCurrency(row.annualWithdrawal) : '—'}
              </Text>
              <Text style={[styles.cellText, styles.colMilestone, { color: COLORS.blue600 }]}>
                {row.goalMilestone ?? ''}
              </Text>
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}
