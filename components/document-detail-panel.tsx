'use client';

import { useQuery } from '@tanstack/react-query';
import { getDocument } from '@/lib/api';
import { FilePreview } from '@/components/file-preview';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import type { ItemMatchResult } from '@/lib/types';

/* ── Helpers ─────────────────────────────────────────────────── */

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const FieldRow = ({
  label,
  value,
  mono,
  wide,
  highlight,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  wide?: boolean;
  highlight?: boolean;
}) => (
  <div className={wide ? 'col-span-2' : ''}>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
      {label}
    </p>
    <div
      className={cn(
        'rounded-md border px-2.5 py-1.5 text-sm min-h-[32px]',
        mono && 'font-mono text-xs',
        highlight
          ? 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
          : 'border-slate-200 bg-slate-50 text-slate-800',
      )}
    >
      {value ?? <span className="text-slate-300">—</span>}
    </div>
  </div>
);

const Section = ({
  title,
  accent,
  children,
  cols = 2,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}) => (
  <div className={cn('rounded-xl border border-slate-200 border-l-4 bg-white overflow-hidden', accent)}>
    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</p>
    </div>
    <div
      className={cn(
        'p-4 gap-x-4 gap-y-3',
        cols === 2 && 'grid grid-cols-2',
        cols === 3 && 'grid grid-cols-3',
        cols === 4 && 'grid grid-cols-4',
      )}
    >
      {children}
    </div>
  </div>
);

/* ── Status badge ─────────────────────────────────────────────── */
const DocStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    parsed:   'bg-emerald-100 text-emerald-800 border-emerald-300',
    parsing:  'bg-amber-100  text-amber-800  border-amber-300',
    failed:   'bg-red-100    text-red-800    border-red-300',
    uploaded: 'bg-slate-100  text-slate-600  border-slate-300',
  };
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
      map[status] ?? map.uploaded,
    )}>
      {status === 'parsed' ? 'Processed' : status}
    </span>
  );
};

/* ── Component ─────────────────────────────────────────────────── */

interface DocumentDetailPanelProps {
  documentId: string;
  documentType: 'po' | 'grn' | 'invoice';
  itemResults?: ItemMatchResult[];
}

export const DocumentDetailPanel = ({
  documentId,
  documentType,
}: DocumentDetailPanelProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId,
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        Failed to load document details.
      </div>
    );
  }

  const accentMap = {
    po:      'border-l-teal-500',
    grn:     'border-l-blue-500',
    invoice: 'border-l-purple-500',
  };

  /* Document number label */
  const docLabel = documentType === 'po'
    ? (data.poNumber ?? data.documentNumber)
    : documentType === 'grn'
    ? (data.grnNumber ?? data.documentNumber)
    : (data.invoiceNumber ?? data.documentNumber);

  return (
    <div className="flex flex-col gap-5 anim-fade-in">
      {/* ── Doc identity strip ── */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold shrink-0',
          documentType === 'po'      ? 'bg-teal-600'   :
          documentType === 'grn'     ? 'bg-blue-600'   :
          'bg-purple-600',
        )}>
          {documentType === 'po' ? 'PO' : documentType === 'grn' ? 'GRN' : 'INV'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate font-mono">{docLabel}</p>
          <p className="text-xs text-slate-400">{formatDate(data.documentDate)} · {data.originalName}</p>
        </div>
        <DocStatusBadge status={data.status} />
      </div>

      {/* ── Two-column layout: form left, preview right ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* LEFT — form sections */}
        <div className="flex flex-col gap-4">

          {/* ── GRN ── */}
          {documentType === 'grn' && (
            <>
              <Section title="GRN Details" accent={accentMap.grn}>
                <FieldRow label="GRN Number"     value={data.grnNumber ?? data.documentNumber} mono />
                <FieldRow label="GRN Date"       value={formatDate(data.documentDate)} />
                <FieldRow label="Challan Number" value={undefined} mono />
                <FieldRow label="Challan Date"   value={undefined} />
              </Section>

              <Section title="Invoice Details" accent="border-l-purple-400">
                <FieldRow label="Invoice Number"  value={undefined} mono />
                <FieldRow label="Due Date"        value={undefined} />
                <FieldRow label="Invoice Date"    value={undefined} />
                <FieldRow label="Net Amount"      value={undefined} />
                <FieldRow label="Outstanding Amt" value={undefined} />
                <FieldRow label="Paid Amount"     value={undefined} />
              </Section>

              <Section title="PO Details" accent={accentMap.po}>
                <FieldRow label="PO Number"     value={data.poNumber} mono />
                <FieldRow label="PO Date"       value={undefined} />
                <FieldRow label="Expiry Date"   value={undefined} />
                <FieldRow label="Delivery Date" value={undefined} />
                <FieldRow label="Total SKUs"    value={data.itemCount} />
                <FieldRow label="Net Amount"    value={undefined} />
              </Section>
            </>
          )}

          {/* ── INVOICE ── */}
          {documentType === 'invoice' && (
            <>
              <Section title="Invoice Details" accent={accentMap.invoice}>
                <FieldRow label="Invoice Number"    value={data.invoiceNumber ?? data.documentNumber} mono />
                <FieldRow label="Due Date"          value={undefined} />
                <FieldRow label="Invoice Date"      value={formatDate(data.documentDate)} />
                <FieldRow label="Net Amount"        value={undefined} />
                <FieldRow label="Outstanding Amount" value={undefined} />
                <FieldRow label="Paid Amount"       value={undefined} />
              </Section>

              <Section title="PO Details" accent={accentMap.po}>
                <FieldRow label="PO Number"     value={data.poNumber} mono />
                <FieldRow label="PO Date"       value={undefined} />
                <FieldRow label="Expiry Date"   value={undefined} />
                <FieldRow label="Delivery Date" value={undefined} />
                <FieldRow label="Total SKUs"    value={data.itemCount} />
                <FieldRow label="Net Amount"    value={undefined} />
              </Section>
            </>
          )}

          {/* ── PURCHASE ORDER ── */}
          {documentType === 'po' && (
            <>
              <Section title="Customer Details" accent={accentMap.po}>
                <FieldRow label="Account Name"              value={data.vendorName} />
                <FieldRow label="Sub-Account"               value={undefined} />
                <FieldRow label="Store Name"                value={undefined} />
                <FieldRow label="Store Code"                value={undefined} />
                <FieldRow label="Store GST"                 value={undefined} mono />
                <FieldRow label="Store Pin Code"            value={undefined} />
                <FieldRow label="Billing Address"           value={undefined} wide />
                <FieldRow label="Store ERP Code"            value={undefined} mono />
                <FieldRow label="Shipping Outlet GST"       value={undefined} mono />
                <FieldRow label="Shipping Outlet Pincode"   value={undefined} />
                <FieldRow label="Shipping Outlet Address"   value={undefined} wide />
              </Section>

              <Section title="PO Details" accent={accentMap.po}>
                <FieldRow label="PO Number"          value={data.poNumber ?? data.documentNumber} mono />
                <FieldRow label="PO Date"            value={formatDate(data.documentDate)} />
                <FieldRow label="Expiry Date"        value={undefined} />
                <FieldRow label="Delivery Date"      value={undefined} />
                <FieldRow label="Total SKUs"         value={data.itemCount} />
                <FieldRow label="Calculated Net Amt" value={undefined} />
                <FieldRow label="Gross Amount"       value={undefined} />
                <FieldRow label="PO Net Amount"      value={undefined} />
                <FieldRow label="Total Quantity"     value={undefined} />
              </Section>

              <Section title="Depot Details" accent="border-l-slate-400">
                <FieldRow label="Depot Name"    value={undefined} />
                <FieldRow label="Depot GST"     value={undefined} mono />
                <FieldRow label="Depot Address" value={undefined} wide />
                <FieldRow label="Depot Pincode" value={undefined} />
              </Section>
            </>
          )}

          {/* File meta — always shown */}
          <Section title="File Information" accent="border-l-slate-300">
            <FieldRow label="Filename"     value={data.originalName} wide />
            <FieldRow label="Parse Status" value={data.status} />
            <FieldRow label="Uploaded"     value={formatDate(data.uploadedAt)} />
            {data.itemCount != null && (
              <FieldRow label="Line Items" value={String(data.itemCount)} />
            )}
          </Section>
        </div>

        {/* RIGHT — file preview */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Document Preview</p>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{data.originalName}</p>
          </div>
          <div className="flex-1 p-2">
            <FilePreview
              documentId={documentId}
              mimeType={data.mimeType}
              filename={data.originalName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
