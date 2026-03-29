// src/components/simulation/DownloadPdfButton.tsx
'use client';

import { useState } from 'react';
import type { FinancialPlan, SimulationResults } from '@/lib/types';

interface DownloadPdfButtonProps {
  plan: FinancialPlan;
  results: SimulationResults;
}

export function DownloadPdfButton({ plan, results }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Lazy import to avoid SSR issues — @react-pdf/renderer is client-only and large
      const [{ pdf }, { FinancialPlanReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/FinancialPlanReport'),
      ]);

      const doc = <FinancialPlanReport plan={plan} results={results} />;
      const blob = await pdf(doc).toBlob();

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial-plan-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError('Failed to generate PDF. Please try again.');
      console.error('[DownloadPdfButton] PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
      >
        {isGenerating ? 'Generating...' : 'Download PDF Report'}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
