import { cn, statusColor, statusLabel } from '@/lib/utils';
import type { MatchStatus } from '@/lib/types';

const dotColor: Record<MatchStatus, string> = {
  matched:               'bg-emerald-500',
  partially_matched:     'bg-amber-500',
  mismatch:              'bg-red-500',
  insufficient_documents:'bg-slate-400',
};

export const StatusBadge = ({ status }: { status: MatchStatus }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
      statusColor[status],
    )}
  >
    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor[status])} />
    {statusLabel[status]}
  </span>
);
