import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'info' | 'teal';
  dot?: boolean;
}

const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-red-100 text-red-800',
  muted:   'bg-slate-100 text-slate-600',
  info:    'bg-sky-100 text-sky-800',
  teal:    'bg-teal-100 text-teal-800',
};

const dotColor: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  muted:   'bg-slate-400',
  info:    'bg-sky-500',
  teal:    'bg-teal-500',
};

export const Badge = ({
  children,
  className,
  variant = 'default',
  dot,
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
      variantClass[variant],
      className,
    )}
  >
    {dot && (
      <span
        className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', dotColor[variant])}
      />
    )}
    {children}
  </span>
);
