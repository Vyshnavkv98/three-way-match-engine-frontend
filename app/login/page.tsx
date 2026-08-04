'use client';

import { login } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertCircle, FileCheck2, GitCompare,
  Layers, ShieldCheck, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileCheck2,
    title: 'AI Document Parsing',
    desc: 'Upload POs, GRNs and Invoices — Gemini extracts every line item.',
  },
  {
    icon: GitCompare,
    title: 'Three-Way Matching',
    desc: 'Automatic qty, price & date reconciliation across all linked documents.',
  },
  {
    icon: Layers,
    title: 'SKU Master Resolution',
    desc: 'Fuzzy-match vendor items to your ERP catalogue with tolerance rules.',
  },
  {
    icon: ShieldCheck,
    title: 'Violation Detection',
    desc: 'Instant flags for duplicates, over-deliveries, price mismatches & more.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      saveToken(res.token, res.expiresAt);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 anim-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-bold text-sm shadow-lg">
            3W
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Three-Way Match Engine
          </span>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-6 anim-slide-up delay-100">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Procurement<br />
              <span className="text-teal-400">reconciliation,</span><br />
              automated.
            </h1>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-sm">
              Upload documents, get instant match results. No spreadsheets, no manual checks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-w-md">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`anim-slide-right delay-${(i + 1) * 50} flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 anim-fade-in delay-300">
          © 2026 Three-Way Match Engine
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm anim-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white font-bold text-sm">
              3W
            </div>
            <span className="text-white font-bold">Three-Way Match Engine</span>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/10">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sign in to access the dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="username"
                label="Username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 anim-slide-down">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center mt-1 gap-2"
                size="lg"
              >
                Sign in
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
              Access restricted to authorised users only.<br />
              Contact your administrator if you need an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
