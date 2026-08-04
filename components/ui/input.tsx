import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'placeholder-slate-400 shadow-sm',
          'transition-colors duration-150',
          'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
          'read-only:bg-slate-50 read-only:text-slate-600',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
