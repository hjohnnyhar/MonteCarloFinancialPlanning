export default function DashboardPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Financial Plan Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Complete the interview to generate your Monte Carlo probability score.
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-sm text-gray-500">No plan data yet. Start the interview to begin.</p>
      </div>
    </div>
  );
}
