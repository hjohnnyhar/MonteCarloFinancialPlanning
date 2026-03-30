import Link from 'next/link';

export function TopNav() {
  return (
    <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
      <Link href="/" className="text-lg font-semibold text-gray-900">
        Financial Planner
      </Link>
      <nav className="ml-auto flex items-center gap-4">
        <span className="text-sm text-gray-500">Single-user prototype</span>
      </nav>
    </header>
  );
}
