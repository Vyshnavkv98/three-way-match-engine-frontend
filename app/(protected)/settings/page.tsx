'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken, getUsername } from '@/lib/auth';
import { ProfileMenu } from '@/components/profile-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  User, LogOut, Bell, Palette,
  Shield, ChevronRight, CheckCircle2,
  Moon, Sun, Monitor,
} from 'lucide-react';

type Theme = 'system' | 'light' | 'dark';

const THEME_OPTS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'system', label: 'System',    icon: Monitor },
  { value: 'light',  label: 'Light',     icon: Sun },
  { value: 'dark',   label: 'Dark',      icon: Moon },
];

const SettingRow = ({
  icon: Icon,
  title,
  desc,
  children,
  border = true,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  children?: React.ReactNode;
  border?: boolean;
}) => (
  <div className={cn('flex items-center gap-4 py-4', border && 'border-b border-slate-100')}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
      <Icon className="h-4.5 w-4.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState('User');
  const [theme, setTheme] = useState<Theme>('system');
  const [notifications, setNotifications] = useState(true);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    setUsername(getUsername());
    const saved = (localStorage.getItem('theme') ?? 'system') as Theme;
    setTheme(saved);
  }, []);

  const handleTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    // Real theme switching would involve adding/removing a class on <html>
  };

  const handleLogout = () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      setTimeout(() => setLogoutConfirm(false), 4000);
      return;
    }
    clearToken();
    router.push('/login');
  };

  // Initials
  const initials = username
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your account and preferences</p>
        </div>
        <ProfileMenu />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* Profile card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden anim-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile</p>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white text-lg font-bold shadow-md">
                  {initials || <User className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{username}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Username</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{username}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden anim-slide-up delay-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferences</p>
            </div>
            <div className="px-6">

              {/* Theme */}
              <SettingRow icon={Palette} title="Theme" desc="Choose your preferred colour scheme">
                <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
                  {THEME_OPTS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleTheme(value)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150',
                        theme === value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              {/* Notifications */}
              <SettingRow icon={Bell} title="Notifications" desc="Toast alerts for uploads and match results" border={false}>
                <button
                  onClick={() => setNotifications((v) => !v)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                    notifications ? 'bg-teal-600' : 'bg-slate-300',
                  )}
                  role="switch"
                  aria-checked={notifications}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      notifications ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </SettingRow>
            </div>
          </div>

          {/* About */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden anim-slide-up delay-100">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">About</p>
            </div>
            <div className="px-6">
              <SettingRow icon={Shield} title="Three-Way Match Engine" desc="AI-powered procurement reconciliation platform">
                <span className="text-xs font-mono text-slate-400">v1.0.0</span>
              </SettingRow>
              <SettingRow icon={CheckCircle2} title="API Connection" desc="Connected to backend at configured base URL" border={false}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </SettingRow>
            </div>
          </div>

          {/* Account actions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden anim-slide-up delay-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Account</p>
            </div>
            <div className="px-6 py-4">
              {logoutConfirm ? (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 anim-slide-down">
                  <p className="text-sm text-red-700 flex-1">Are you sure you want to sign out?</p>
                  <Button variant="secondary" size="sm" onClick={() => setLogoutConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleLogout}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                  <ChevronRight className="h-4 w-4 ml-auto text-red-400" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
