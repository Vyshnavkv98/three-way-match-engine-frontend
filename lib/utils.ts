import type { MatchStatus, ReasonCode } from './types';

export const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatNumber = (value?: number): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);
};

export const statusLabel: Record<MatchStatus, string> = {
  matched: 'Matched',
  partially_matched: 'Partially Matched',
  mismatch: 'Mismatch',
  insufficient_documents: 'Insufficient Documents',
};

export const statusColor: Record<MatchStatus, string> = {
  matched: 'bg-emerald-100 text-emerald-800',
  partially_matched: 'bg-amber-100 text-amber-800',
  mismatch: 'bg-red-100 text-red-800',
  insufficient_documents: 'bg-slate-100 text-slate-600',
};

export const reasonLabel: Record<ReasonCode, string> = {
  grn_qty_exceeds_po_qty: 'GRN Qty Exceeds PO Qty',
  invoice_qty_exceeds_grn_qty: 'Invoice Qty Exceeds GRN Qty',
  invoice_qty_exceeds_po_qty: 'Invoice Qty Exceeds PO Qty',
  invoice_date_after_po_date: 'Invoice Date After PO Date',
  duplicate_po: 'Duplicate PO',
  duplicate_document: 'Duplicate Document',
  item_missing_in_po: 'Item Missing in PO',
  price_mismatch: 'Price Mismatch',
  mrp_mismatch: 'MRP Mismatch',
  unmapped_master_sku: 'Unmapped SKU',
};

export const HARD_VIOLATIONS = new Set<ReasonCode>([
  'grn_qty_exceeds_po_qty',
  'invoice_qty_exceeds_grn_qty',
  'invoice_qty_exceeds_po_qty',
  'invoice_date_after_po_date',
  'duplicate_po',
  'duplicate_document',
  'item_missing_in_po',
]);

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(' ');
