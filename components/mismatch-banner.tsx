'use client';

import type { Violation } from '@/lib/types';
import { cn, reasonLabel, HARD_VIOLATIONS } from '@/lib/utils';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface MismatchBannerProps {
  violations: Violation[];
}

export const MismatchBanner = ({ violations }: MismatchBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (!violations.length || dismissed) return null;

  const hasHard = violations.some((v) => HARD_VIOLATIONS.has(v.code));
  const hard    = violations.filter((v) => HARD_VIOLATIONS.has(v.code));
  const soft    = violations.filter((v) => !HARD_VIOLATIONS.has(v.code));

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3 anim-slide-down',
      hasHard
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200',
    )}>
      {/* Icon */}
      <div className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
        hasHard ? 'bg-red-200' : 'bg-amber-200',
      )}>
        {hasHard
          ? <AlertCircle className="h-3.5 w-3.5 text-red-700" />
          : <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-xs font-bold mr-2', hasHard ? 'text-red-800' : 'text-amber-800')}>
          {hasHard ? 'Mismatch Detected' : 'Warnings'}
        </span>

        {/* Hard chips */}
        {hard.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 mr-1.5 mb-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
            <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
            {reasonLabel[v.code]}
            {v.matchKey && <span className="font-mono opacity-70 ml-0.5">[{v.matchKey}]</span>}
          </span>
        ))}

        {/* Soft chips */}
        {soft.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 mr-1.5 mb-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
            {reasonLabel[v.code]}
            {v.matchKey && <span className="font-mono opacity-70 ml-0.5">[{v.matchKey}]</span>}
          </span>
        ))}
      </div>

      {/* Count + dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-bold',
          hasHard ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900',
        )}>
          {violations.length}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={cn(
            'rounded-full p-0.5 transition-colors',
            hasHard ? 'text-red-400 hover:bg-red-200 hover:text-red-700' : 'text-amber-400 hover:bg-amber-200 hover:text-amber-700',
          )}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
