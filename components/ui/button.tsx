import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300 shadow-sm shadow-teal-200',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50',
  ghost:
    'text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 shadow-sm',
  'outline-danger':
    'bg-white text-red-600 border border-red-300 hover:bg-red-50 active:bg-red-100 disabled:opacity-50',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed select-none',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="3"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            className="opacity-75"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
