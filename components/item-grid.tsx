'use client';

import { useState } from 'react';
import type { ItemMatchResult } from '@/lib/types';
import { cn, formatCurrency, formatNumber, reasonLabel, HARD_VIOLATIONS } from '@/lib/utils';
import { AlertTriangle, Search, X, ChevronUp, ChevronDown } from 'lucide-react';

/* ── Clean matchKey — strip everything after first whitespace/newline.
   The raw key from Gemini parsing sometimes contains the full description
   like "18906 psm\nSpring Rolls Veg..." — we only want the code part. ── */
function cleanKey(raw: string): string {
  // Take only the first token (up to first space, tab, or newline)
  const first = raw.trim().split(/[\s\n\r\t]+/)[0] ?? raw;
  return first.trim();
}

interface ItemGridProps {
  items: ItemMatchResult[];
}

/* ── Sub-components ─────────────────────────────────────────── */

const Th = ({
  children,
  right,
  center,
  muted,
  highlight,
  sortable,
  sortDir,
  onSort,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
  muted?: boolean;
  highlight?: boolean;
  sortable?: boolean;
  sortDir?: 'asc' | 'desc' | null;
  onSort?: () => void;
}) => (
  <th
    onClick={sortable ? onSort : undefined}
    className={cn(
      'px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap border-b border-slate-200/80 select-none bg-gradient-to-b from-slate-50/90 to-slate-100/50 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]',
      right   ? 'text-right'  : center ? 'text-center' : 'text-left',
      muted   ? 'text-slate-400' : 'text-slate-600',
      highlight && 'bg-gradient-to-b from-amber-50 to-amber-100/50 text-amber-800 shadow-[inset_0_-1px_0_rgba(245,158,11,0.2)]',
      sortable && 'cursor-pointer hover:from-slate-100 hover:to-slate-200/80 transition-all duration-300',
    )}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sortable && sortDir === 'asc'  && <ChevronUp   className="h-2.5 w-2.5 text-teal-600" />}
      {sortable && sortDir === 'desc' && <ChevronDown className="h-2.5 w-2.5 text-teal-600" />}
    </span>
  </th>
);

/* Cell — supports highlight variants matching the reference screenshots */
type CellHighlight = 'error' | 'warn' | 'ok' | 'none';

const Td = ({
  children,
  right,
  center,
  mono,
  bold,
  muted,
  hl,
  className,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
  mono?: boolean;
  bold?: boolean;
  muted?: boolean;
  hl?: CellHighlight;
  className?: string;
}) => (
  <td
    className={cn(
      'px-3 py-2.5 text-[11px] border-b border-slate-100/80 whitespace-nowrap transition-colors duration-300 group-hover:border-slate-200/80',
      right   ? 'text-right'  : center ? 'text-center' : 'text-left',
      mono    ? 'font-mono font-medium tracking-tight'  : '',
      bold    ? 'font-bold' : '',
      muted   ? 'text-slate-400' : 'text-slate-700',
      hl === 'error' && 'bg-red-50/80 text-red-700 font-semibold shadow-[inset_2px_0_0_#ef4444]',
      hl === 'warn'  && 'bg-amber-50/80 text-amber-700 font-semibold shadow-[inset_2px_0_0_#f59e0b]',
      hl === 'ok'    && 'text-emerald-600',
      className,
    )}
  >
    {children}
  </td>
);

/* ── Main component ─────────────────────────────────────────── */

export const ItemGrid = ({ items }: ItemGridProps) => {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol]   = useState<string | null>(null);
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc');
  const [showAll, setShowAll]   = useState(false);

  /* Filter */
  const filtered = search.trim()
    ? items.filter((item: ItemMatchResult) => {
        const q = search.toLowerCase();
        const key = cleanKey(item.matchKey).toLowerCase();
        return (
          key.includes(q) ||
          (item.skuInfo?.name ?? '').toLowerCase().includes(q) ||
          (item.skuInfo?.skuErpCode ?? '').toLowerCase().includes(q) ||
          (item.skuInfo?.eanCode ?? '').toLowerCase().includes(q) ||
          (item.skuInfo?.hsnCode ?? '').toLowerCase().includes(q)
        );
      })
    : items;

  /* Sort */
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        let av: number | string = 0, bv: number | string = 0;
        if (sortCol === 'poQty')     { av = a.poQty ?? 0;            bv = b.poQty ?? 0; }
        if (sortCol === 'grnQty')    { av = a.grnQty;                bv = b.grnQty; }
        if (sortCol === 'invQty')    { av = a.invoiceQty;            bv = b.invoiceQty; }
        if (sortCol === 'unitPrice') { av = a.invoiceUnitRate ?? 0;  bv = b.invoiceUnitRate ?? 0; }
        if (sortCol === 'grossAmt')  {
          av = (a.invoiceUnitRate ?? 0) * a.invoiceQty;
          bv = (b.invoiceUnitRate ?? 0) * b.invoiceQty;
        }
        if (sortCol === 'name') { av = a.skuInfo?.name ?? cleanKey(a.matchKey); bv = b.skuInfo?.name ?? cleanKey(b.matchKey); }
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
      })
    : filtered;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const display = showAll ? sorted : sorted.slice(0, 50);

  if (!items.length)
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-10 text-center">
        <AlertTriangle className="h-7 w-7 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No line items found.</p>
      </div>
    );

  /* ── counts for legend ── */
  const errCount  = items.filter((i: ItemMatchResult) => i.reasonCodes.some((c) => HARD_VIOLATIONS.has(c))).length;
  const warnCount = items.filter((i: ItemMatchResult) => i.reasonCodes.length > 0 && !i.reasonCodes.some((c) => HARD_VIOLATIONS.has(c))).length;
  const unmapped  = items.filter((i: ItemMatchResult) => !i.isMapped).length;

  return (
    <div className="flex flex-col gap-2">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-7 py-1.5 text-xs placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
            placeholder="Search SKU, ERP code, EAN, HSN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Counts */}
        <span className="text-[11px] text-slate-500 font-medium">
          {sorted.length}/{items.length} items
        </span>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3">
          {errCount  > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[10px] font-bold text-red-700"><span className="h-2 w-2 rounded-sm bg-red-400" />{errCount} mismatch{errCount > 1 ? 'es' : ''}</span>}
          {warnCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-700"><span className="h-2 w-2 rounded-sm bg-amber-400" />{warnCount} warning{warnCount > 1 ? 's' : ''}</span>}
          {unmapped  > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-300 px-2.5 py-0.5 text-[10px] font-bold text-orange-700"><span className="h-2 w-2 rounded-sm bg-orange-400" />{unmapped} unmapped</span>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              {/* Fixed identity columns */}
              <Th muted>#</Th>
              <Th sortable sortDir={sortCol === 'name' ? sortDir : null} onSort={() => handleSort('name')}>
                SKU Name
              </Th>
              <Th muted>Article ID</Th>
              <Th muted>ERP Code</Th>
              <Th muted>EAN</Th>
              <Th muted>HSN</Th>
              <Th muted center>UOM</Th>
              <Th muted>Brand</Th>
              <Th muted center>Status</Th>

              {/* Quantity columns */}
              <Th right sortable sortDir={sortCol === 'poQty' ? sortDir : null} onSort={() => handleSort('poQty')}>
                PO Qty
              </Th>
              <Th right sortable sortDir={sortCol === 'grnQty' ? sortDir : null} onSort={() => handleSort('grnQty')}>
                GRN Qty
              </Th>
              <Th right sortable sortDir={sortCol === 'invQty' ? sortDir : null} onSort={() => handleSort('invQty')}>
                Inv Qty
              </Th>

              {/* Price columns — highlighted header when any mismatch */}
              <Th right highlight={errCount > 0 || warnCount > 0} sortable sortDir={sortCol === 'unitPrice' ? sortDir : null} onSort={() => handleSort('unitPrice')}>
                Unit Price
              </Th>
              <Th right muted>Agreed Rate</Th>
              <Th right muted>Tolerance</Th>
              <Th right highlight={errCount > 0 || warnCount > 0}>Unit MRP</Th>
              <Th right muted>Master MRP</Th>

              {/* Computed */}
              <Th right sortable sortDir={sortCol === 'grossAmt' ? sortDir : null} onSort={() => handleSort('grossAmt')}>
                Gross Amt
              </Th>

              {/* Reason codes */}
              <Th>Issues</Th>
            </tr>
          </thead>

          <tbody>
            {display.map((item: ItemMatchResult, idx: number) => {
              const hasPriceMismatch = item.reasonCodes.includes('price_mismatch');
              const hasMrpMismatch   = item.reasonCodes.includes('mrp_mismatch');
              const hasGrnExceed     = item.reasonCodes.includes('grn_qty_exceeds_po_qty');
              const hasInvExceedPo   = item.reasonCodes.includes('invoice_qty_exceeds_po_qty');
              const hasInvExceedGrn  = item.reasonCodes.includes('invoice_qty_exceeds_grn_qty');
              const isUnmapped       = !item.isMapped;
              const hasHard          = item.reasonCodes.some((c) => HARD_VIOLATIONS.has(c));
              const hasWarn          = item.reasonCodes.length > 0;

              const grossAmt = (item.invoiceUnitRate !== undefined && item.invoiceQty)
                ? item.invoiceUnitRate * item.invoiceQty
                : undefined;

              /* Row stripe — only unmapped gets a full row tint; 
                 for mismatches we highlight individual cells instead */
              const rowCls = cn(
                'transition-all duration-300 ease-in-out group hover:bg-slate-50 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] relative z-0 hover:z-10',
                isUnmapped && !hasHard && !hasWarn
                  ? 'bg-orange-50/30'
                  : 'bg-white',
              );

              /* Per-row status badge */
              const rowStatusBadge = isUnmapped ? (
                <span className="inline-flex items-center gap-0.5 rounded-sm bg-orange-100 border border-orange-300 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                  <AlertTriangle className="h-2.5 w-2.5" /> Unmapped
                </span>
              ) : hasHard ? (
                <span className="rounded-sm bg-red-100 border border-red-300 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                  Mismatch
                </span>
              ) : hasWarn ? (
                <span className="rounded-sm bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  Warning
                </span>
              ) : (
                <span className="rounded-sm bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  OK
                </span>
              );

              return (
                <tr key={`${idx}-${cleanKey(item.matchKey)}`} className={rowCls}>

                  {/* # */}
                  <Td muted mono center className="w-8 text-slate-400">{idx + 1}</Td>

                  {/* SKU Name — use resolved master name if mapped, else show cleaned matchKey */}
                  <Td bold title={item.skuInfo?.name ?? cleanKey(item.matchKey)}>
                    <div className="max-w-[200px] truncate">
                      {item.skuInfo ? (
                        <span className="text-slate-800">{item.skuInfo.name}</span>
                      ) : (
                        <span className="text-orange-600 italic text-[10px]">
                          {cleanKey(item.matchKey)}
                          <span className="ml-1 not-italic text-orange-400">(unresolved)</span>
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* Article ID — cleaned vendor item code from the document */}
                  <Td mono muted className="text-slate-500 text-[10px]" title={item.matchKey}>
                    <div className="max-w-[130px] truncate">
                      <span>{cleanKey(item.matchKey)}</span>
                      {/* Show vendor SKU code from master if it differs from matchKey */}
                      {item.skuInfo?.vendorSkuCode && item.skuInfo.vendorSkuCode !== cleanKey(item.matchKey) && (
                        <span className="ml-1 text-orange-500" title={`Vendor SKU: ${item.skuInfo.vendorSkuCode}`}>
                          /{cleanKey(item.skuInfo.vendorSkuCode)}
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* ERP Code */}
                  <Td mono className="text-teal-700 font-semibold">
                    {item.skuInfo?.skuErpCode ?? '—'}
                  </Td>

                  {/* EAN */}
                  <Td mono muted>{item.skuInfo?.eanCode ?? '—'}</Td>

                  {/* HSN */}
                  <Td mono muted>{item.skuInfo?.hsnCode ?? '—'}</Td>

                  {/* UOM */}
                  <Td center muted>{item.skuInfo?.uom ?? '—'}</Td>

                  {/* Brand */}
                  <Td muted>
                    <div className="max-w-[90px] truncate" title={item.skuInfo?.brand}>
                      {item.skuInfo?.brand ?? '—'}
                    </div>
                  </Td>

                  {/* Row status */}
                  <Td center>{rowStatusBadge}</Td>

                  {/* PO Qty */}
                  <Td right mono>{formatNumber(item.poQty)}</Td>

                  {/* GRN Qty — red cell if exceeds PO */}
                  <Td right mono hl={hasGrnExceed ? 'error' : 'none'}>
                    {formatNumber(item.grnQty)}
                  </Td>

                  {/* Inv Qty — red if exceeds PO/GRN */}
                  <Td right mono hl={hasInvExceedPo || hasInvExceedGrn ? 'error' : 'none'}>
                    {formatNumber(item.invoiceQty)}
                  </Td>

                  {/* Unit Price — amber/red if price mismatch */}
                  <Td right mono hl={hasPriceMismatch ? (hasHard ? 'error' : 'warn') : 'none'}>
                    {formatCurrency(item.invoiceUnitRate)}
                  </Td>

                  {/* Agreed Rate */}
                  <Td right mono muted>
                    {formatCurrency(item.agreedRate ?? item.skuInfo?.agreedRate)}
                  </Td>

                  {/* Price Tolerance */}
                  <Td right mono muted>
                    {item.skuInfo?.priceTolerance != null
                      ? `${(item.skuInfo.priceTolerance * 100).toFixed(0)}%`
                      : '—'}
                  </Td>

                  {/* Unit MRP — amber/red if MRP mismatch */}
                  <Td right mono hl={hasMrpMismatch ? (hasHard ? 'error' : 'warn') : 'none'}>
                    {formatCurrency(item.documentMrp)}
                  </Td>

                  {/* Master MRP */}
                  <Td right mono muted>
                    {formatCurrency(item.masterMrp)}
                  </Td>

                  {/* Gross Amount */}
                  <Td right mono bold className="text-slate-800">
                    {formatCurrency(grossAmt)}
                  </Td>

                  {/* Issues — compact chips */}
                  <Td className="min-w-[120px] max-w-[200px]">
                    <div className="flex flex-wrap gap-0.5">
                      {isUnmapped && (
                        <span className="rounded bg-orange-100 border border-orange-300 px-1 py-0.5 text-[9px] font-bold text-orange-700">
                          Unmapped
                        </span>
                      )}
                      {item.reasonCodes
                        .filter((c: string) => c !== 'unmapped_master_sku')
                        .map((c: string) => {
                          const isHard = HARD_VIOLATIONS.has(c as import('@/lib/types').ReasonCode);
                          const label = {
                            price_mismatch: 'Price ✗',
                            mrp_mismatch: 'MRP ✗',
                            grn_qty_exceeds_po_qty: 'GRN>PO',
                            invoice_qty_exceeds_grn_qty: 'INV>GRN',
                            invoice_qty_exceeds_po_qty: 'INV>PO',
                            invoice_date_after_po_date: 'Date ✗',
                            duplicate_po: 'Dup PO',
                            duplicate_document: 'Dup Doc',
                            item_missing_in_po: 'Missing',
                          }[c] ?? c;
                          return (
                            <span
                              key={c}
                              title={reasonLabel[c as import('@/lib/types').ReasonCode] ?? c}
                              className={cn(
                                'rounded px-1 py-0.5 text-[9px] font-bold border',
                                isHard
                                  ? 'bg-red-100 text-red-700 border-red-300'
                                  : 'bg-amber-100 text-amber-700 border-amber-300',
                              )}
                            >
                              {label}
                            </span>
                          );
                        })}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty search result */}
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">
            No items match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Show more */}
      {sorted.length > 50 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          Show all {sorted.length} items (currently showing 50)
        </button>
      )}
    </div>
  );
};
