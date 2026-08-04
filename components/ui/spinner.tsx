import { cn } from '@/lib/utils';

export const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin text-teal-600', className ?? 'h-6 w-6')}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);
