import { Suspense } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-56 border-r border-gray-200 bg-gray-50" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-auto bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
