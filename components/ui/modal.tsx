'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Don't close when backdrop is clicked */
  persistent?: boolean;
}

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  persistent,
}: ModalProps) => {
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    document.addEventListener('keydown', handler);
    // move focus into modal
    setTimeout(() => firstFocusRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, persistent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="modal-overlay absolute inset-0 bg-slate-900/60"
        onClick={persistent ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'anim-slide-up relative z-10 w-full rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.06] flex flex-col max-h-[90vh]',
          className ?? 'max-w-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex flex-col gap-0.5 pr-4">
            <h2
              id="modal-title"
              className="text-base font-semibold text-slate-900 leading-snug"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            ref={firstFocusRef}
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
