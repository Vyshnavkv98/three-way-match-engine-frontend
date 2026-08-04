'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { clearToken, getUsername } from '@/lib/auth';
import { cn } from '@/lib/utils';

export const ProfileMenu = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const menuRef = useRef<HTMLDivElement>(null);

  // Read username client-side only (localStorage unavailable on server)
  useEffect(() => {
    setUsername(getUsername());
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    clearToken();
    router.push('/login');
  };

  // Initials avatar from username
  const initials = username
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors',
          open
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-xs font-bold select-none shrink-0">
          {initials || <User className="h-3.5 w-3.5" />}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate">{username}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-sm font-bold">
              {initials || <User className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{username}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
