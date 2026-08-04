'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocument } from '@/lib/api';
import { FilePreview } from '@/components/file-preview';
import { Spinner } from '@/components/ui/spinner';
import { cn, formatDate } from '@/lib/utils';
import type { DocumentType } from '@/lib/types';
import Link from 'next/link';
import {
  X, FileText, Truck, ReceiptText, GitCompare, AlertCircle,
} from 'lucide-react';

export interface DrawerDoc {
  /** The documentId from LinkedDocument — used to fetch full details */
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  documentDate?: string;
  poNumber?: string;
  vendorName?: string;
  /** Optional — if available avoids a round-trip for mimeType */
  mimeType?: string;
}

interface DocPreviewDrawerProps {
  doc: DrawerDoc | null;
  onClose: () => void;
}

const TYPE_META: Record<DocumentType, { label: string; icon: React.ElementType; pill: string }> = {
  po:      { label: 'Purchase Order', icon: FileText,    pill: 'bg-teal-100 text-teal-700' },
  grn:     { label: 'GRN',            icon: Truck,       pill: 'bg-blue-100 text-blue-700' },
  invoice: { label: 'Invoice',        icon: ReceiptText, pill: 'bg-purple-100 text-purple-700' },
};

/** Inner content — only rendered when a doc is selected */
function DrawerContent({ doc, onClose }: { doc: DrawerDoc; onClose: () => void }) {
  const meta = TYPE_META[doc.documentType];

  /* Fetch full document detail to get the confirmed id and mimeType */
  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ['document', doc.documentId],
    queryFn: () => getDocument(doc.documentId),
    staleTime: 60_000,
  });

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5 shrink-0">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0', meta.pill)}>
          <meta.icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {detail?.originalName ?? doc.documentNumber}
          </p>
          {(detail?.documentDate ?? doc.documentDate) && (
            <p className="text-xs text-slate-400">
              {formatDate(detail?.documentDate ?? doc.documentDate)}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Meta strip ── */}
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 shrink-0 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {doc.documentType === 'po' ? 'PO Number' : doc.documentType === 'grn' ? 'GRN Number' : 'Invoice Number'}
          </p>
          <p className="text-xs font-mono font-semibold text-slate-800">{doc.documentNumber}</p>
        </div>

        {(detail?.poNumber ?? doc.poNumber) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PO Number</p>
            <p className="text-xs font-mono font-semibold text-teal-700">
              {detail?.poNumber ?? doc.poNumber}
            </p>
          </div>
        )}

        {(detail?.vendorName ?? doc.vendorName) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
              {detail?.vendorName ?? doc.vendorName}
            </p>
          </div>
        )}

        {detail?.status && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
            <p className={cn(
              'text-xs font-semibold capitalize',
              detail.status === 'parsed'  ? 'text-emerald-600'
              : detail.status === 'failed' ? 'text-red-600'
              : 'text-amber-600',
            )}>
              {detail.status}
            </p>
          </div>
        )}

        {detail?.itemCount != null && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Items</p>
            <p className="text-xs font-semibold text-slate-800">{detail.itemCount}</p>
          </div>
        )}

        {/* Match Center link */}
        {(detail?.poNumber ?? doc.poNumber ?? doc.documentType === 'po') && (
          <Link
            href={`/match-center?po=${encodeURIComponent(
              detail?.poNumber ?? doc.poNumber ?? doc.documentNumber
            )}`}
            onClick={onClose}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <GitCompare className="h-3.5 w-3.5" />
            Open in Match Center
          </Link>
        )}
      </div>

      {/* ── Body: loading / error / preview ── */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col gap-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Spinner className="h-8 w-8" />
            <p className="text-sm">Loading document info…</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Could not load document</p>
              <p className="text-xs text-slate-400 mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        )}

        {/* Render FilePreview as soon as we have the document detail — the raw file
            is always stored regardless of parse status. Only skip if detail fetch failed. */}
        {!isLoading && !isError && detail && (
          <>
            {(detail.status === 'parsing') && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 shrink-0">
                <Spinner className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-amber-700">
                  AI is still extracting line items — the raw file is shown below.
                </p>
              </div>
            )}
            {(detail.status === 'failed') && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 shrink-0">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">
                  AI parsing failed — showing raw file. Try re-uploading for better results.
                </p>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <FilePreview
                documentId={doc.documentId}
                mimeType={detail.mimeType ?? doc.mimeType}
                filename={detail.originalName}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export const DocPreviewDrawer = ({ doc, onClose }: DocPreviewDrawerProps) => {
  /* Escape key closes */
  useEffect(() => {
    if (!doc) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [doc, onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = doc ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [doc]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300',
          doc ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Document preview"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[52%] min-w-[440px] max-w-3xl flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          doc ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {doc
          ? <DrawerContent doc={doc} onClose={onClose} />
          : null}
      </div>
    </>
  );
};
