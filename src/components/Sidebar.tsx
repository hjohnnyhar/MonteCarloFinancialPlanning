import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Interview', href: '/interview' },
  { label: 'Simulation', href: '/simulation' },
  { label: 'Results', href: '/results' },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-gray-50 px-4 py-6">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
