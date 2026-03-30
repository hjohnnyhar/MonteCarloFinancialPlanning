'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { WIZARD_STEPS } from '@/lib/wizardSteps';
import { wizardStore } from '@/lib/wizardStore';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId') ?? '';
  const wizardStepIndex = useSyncExternalStore(wizardStore.subscribe, wizardStore.getStepIndex, () => 0);
  const completedSteps = useSyncExternalStore(wizardStore.subscribe, wizardStore.getCompletedSteps, wizardStore.getCompletedSteps);

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Interview', href: '/interview' },
    { label: 'Simulation', href: '/simulation' },
  ].map((item) => ({
    ...item,
    href: planId && item.href !== '/' ? `${item.href}?planId=${encodeURIComponent(planId)}` : item.href,
  }));

  const isInterviewRoute = pathname === '/interview';

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-gray-50 px-4 py-6">
      {isInterviewRoute ? (
        <nav aria-label="Wizard progress" className="flex flex-col gap-1">
          {WIZARD_STEPS.map((step, index) => {
            const isActive = index === wizardStepIndex;
            const isCompleted = completedSteps.includes(index);

            if (isActive) {
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-md bg-blue-50 px-3 py-2"
                  aria-current="step"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-blue-700">{step.title}</span>
                </div>
              );
            }

            if (isCompleted) {
              return (
                <button
                  key={step.id}
                  onClick={() => wizardStore.setStepIndex(index)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-100"
                  aria-label={`Edit ${step.title}, step ${index + 1}`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">
                    &#10003;
                  </span>
                  <span className="text-sm text-gray-700">{step.title}</span>
                </button>
              );
            }

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 opacity-50 cursor-not-allowed"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-400">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-400">{step.title}</span>
              </div>
            );
          })}
        </nav>
      ) : (
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
      )}
    </aside>
  );
}
