// src/components/simulation/SimulationSkeleton.tsx

export function SimulationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Headline score skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-10 w-24 rounded bg-gray-200" />
      </div>
      {/* Goal results skeleton — 3 placeholder rows */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="h-4 w-40 rounded bg-gray-200" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
