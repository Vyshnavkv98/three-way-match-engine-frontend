import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  className?: string;
}

export const Pagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  /* build window of up to 5 page buttons */
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const Btn = ({
    onClick,
    disabled,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-1 text-xs font-semibold transition-colors',
        active
          ? 'bg-teal-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-3', className)}>
      {/* Info */}
      <p className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
        Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <Btn onClick={() => onPageChange(1)} disabled={page === 1} title="First page">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Previous page">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Btn>

        {start > 1 && (
          <>
            <Btn onClick={() => onPageChange(1)}>1</Btn>
            {start > 2 && <span className="px-1 text-xs text-slate-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <Btn key={p} onClick={() => onPageChange(p)} active={p === page}>
            {p}
          </Btn>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-xs text-slate-400">…</span>}
            <Btn onClick={() => onPageChange(totalPages)}>{totalPages}</Btn>
          </>
        )}

        <Btn onClick={() => onPageChange(page + 1)} disabled={page === totalPages} title="Next page">
          <ChevronRight className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => onPageChange(totalPages)} disabled={page === totalPages} title="Last page">
          <ChevronsRight className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </div>
  );
};
