'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  GitCompare,
  FileStack,
  Database,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearToken } from '@/lib/auth';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload-documents', icon: Upload,          label: 'Upload Documents' },
  { href: '/match-center',     icon: GitCompare,      label: 'Match Center' },
  { href: '/documents',        icon: FileStack,       label: 'Documents' },
  { href: '/sku-master',       icon: Database,        label: 'SKU Master' },
  { href: '/settings',         icon: Settings,        label: 'Settings' },
];

const Tip = ({ label }: { label: string }) => (
  <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
    {label}
    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
  </span>
);

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmStep, setConfirmStep] = useState(false);

  const handleLogout = () => {
    if (!confirmStep) {
      setConfirmStep(true);
      setTimeout(() => setConfirmStep(false), 3000);
      return;
    }
    clearToken();
    router.push('/login');
  };

  return (
    <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-200 select-none anim-bounce-in hover:bg-teal-700 transition-colors"
      >
        3W
      </Link>

      <div className="w-6 border-t border-slate-100 mb-1" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-0.5 w-full px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
                active
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-300'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <Tip label={label} />
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="flex flex-col items-center gap-0.5 px-2 w-full">
        {confirmStep && (
          <span className="text-[9px] text-red-500 font-semibold leading-none text-center anim-fade-in">
            confirm?
          </span>
        )}
        <button
          onClick={handleLogout}
          aria-label={confirmStep ? 'Confirm logout' : 'Log out'}
          className={cn(
            'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
            confirmStep
              ? 'bg-red-100 text-red-600'
              : 'text-slate-400 hover:bg-red-50 hover:text-red-500',
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          <Tip label={confirmStep ? 'Click again to confirm' : 'Log out'} />
        </button>
      </div>
    </aside>
  );
};
