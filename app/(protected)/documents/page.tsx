'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ProfileMenu } from '@/components/profile-menu';
import { FilePreview } from '@/components/file-preview';
import { formatDate, cn } from '@/lib/utils';
import type { DocumentListItem } from '@/lib/types';
import Link from 'next/link';
import {
  Search, Upload, FileText, Truck, ReceiptText,
  CheckCircle2, AlertCircle, Clock,
  Download, ChevronLeft, ChevronRight, Eye, Filter, X,
  GitCompare,
} from 'lucide-react';

const PAGE_SIZE = 15;

const TYPE_FILTERS = [
  { value: '',        label: 'All Types' },
  { value: 'po',      label: 'Purchase Orders' },
  { value: 'grn',     label: 'GRNs' },
  { value: 'invoice', label: 'Invoices' },
];
const STATUS_FILTERS = [
  { value: '',        label: 'All Statuses' },
  { value: 'parsed',  label: 'Parsed' },
  { value: 'parsing', label: 'Processing' },
  { value: 'failed',  label: 'Failed' },
];

const typeIcon = (t: DocumentListItem['documentType']) => ({
  po:      <FileText   className="h-4 w-4 text-teal-600" />,
  grn:     <Truck      className="h-4 w-4 text-blue-600" />,
  invoice: <ReceiptText className="h-4 w-4 text-purple-600" />,
}[t]);

const typePill = (t: DocumentListItem['documentType']) => ({
  po:      'bg-teal-50   text-teal-700',
  grn:     'bg-blue-50   text-blue-700',
  invoice: 'bg-purple-50 text-purple-700',
}[t]);

const typeLabel = (t: DocumentListItem['documentType']) => ({
  po: 'PO', grn: 'GRN', invoice: 'Invoice',
}[t]);

const statusInfo = (s: DocumentListItem['status']) => {
  if (s === 'parsed')   return { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, cls: 'text-emerald-700', label: 'Parsed' };
  if (s === 'parsing')  return { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,          cls: 'text-amber-700',   label: 'Processing' };
  if (s === 'failed')   return { icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,       cls: 'text-red-700',     label: 'Failed' };
  return                       { icon: <Clock className="h-3.5 w-3.5 text-slate-400" />,           cls: 'text-slate-600',   label: 'Uploaded' };
};

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentListItem | null>(null);

  const params: Record<string, string | number> = {
    page, limit: PAGE_SIZE,
    ...(search      ? { search }                         : {}),
    ...(typeFilter  ? { documentType: typeFilter }       : {}),
    ...(statusFilter? { status: statusFilter }           : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['documents', page, search, typeFilter, statusFilter],
    queryFn: () => listDocuments(params),
    placeholderData: (prev) => prev,
  });

  const docs  = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900">Documents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLoading ? '…' : `${total} document${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/upload-documents">
            <Button size="sm"><Upload className="h-4 w-4" /> Upload</Button>
          </Link>
          <ProfileMenu />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── List panel ── */}
        <div className={cn('flex flex-col h-full transition-all duration-200', previewDoc ? 'w-[55%]' : 'w-full')}>
          {/* Filters */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 bg-white shrink-0 flex-wrap">
            <form onSubmit={handleSearch} className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-colors"
                placeholder="Search filename, PO, vendor…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </form>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            {isFetching && !isLoading && <Spinner className="h-4 w-4 ml-auto" />}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">
                  {search || typeFilter || statusFilter ? 'No documents match your filters.' : 'No documents uploaded yet.'}
                </p>
                {!search && !typeFilter && !statusFilter && (
                  <Link href="/upload-documents">
                    <Button variant="secondary" size="sm"><Upload className="h-4 w-4" /> Upload</Button>
                  </Link>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Type', 'Filename', 'PO Number', 'Vendor', 'Items', 'Size', 'Status', 'Uploaded', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {docs.map((doc, i) => {
                    const st = statusInfo(doc.status);
                    const isActive = previewDoc?.id === doc.id;
                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          'hover:bg-slate-50 transition-colors cursor-pointer anim-fade-in',
                          isActive && 'bg-teal-50',
                        )}
                        style={{ animationDelay: `${Math.min(i * 15, 150)}ms` }}
                        onClick={() => setPreviewDoc(isActive ? null : doc)}
                      >
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', typePill(doc.documentType))}>
                            {typeIcon(doc.documentType)}
                            {typeLabel(doc.documentType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="font-medium text-slate-800 truncate text-xs">{doc.originalName}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-teal-700">{doc.poNumber ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[100px] truncate">{doc.vendorName ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 text-center">{doc.itemCount ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{fmtBytes(doc.sizeBytes)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 text-xs', st.cls)}>
                            {st.icon}{st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setPreviewDoc(isActive ? null : doc)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {doc.poNumber && (
                              <Link
                                href={`/match-center?po=${encodeURIComponent(doc.poNumber)}`}
                                className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-teal-600 hover:bg-teal-50 transition-colors font-medium"
                                title="View match"
                              >
                                Match
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 shrink-0">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                        p === page ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview panel ── */}
        {previewDoc && (
          <div className="flex flex-col w-[45%] border-l border-slate-200 bg-white h-full anim-slide-right shrink-0">
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0', typePill(previewDoc.documentType))}>
                  {typeIcon(previewDoc.documentType)}
                  {typeLabel(previewDoc.documentType)}
                </span>
                <p className="text-sm font-semibold text-slate-800 truncate">{previewDoc.originalName}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors shrink-0 ml-2"
                title="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
              {[
                ['PO Number',  previewDoc.poNumber ?? '—'],
                ['Vendor',     previewDoc.vendorName ?? '—'],
                ['Items',      String(previewDoc.itemCount ?? '—')],
                ['Uploaded',   formatDate(previewDoc.uploadedAt)],
                ['Status',     previewDoc.status],
                ['Size',       fmtBytes(previewDoc.sizeBytes)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-xs text-slate-800 font-medium mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Match Center shortcut */}
            {previewDoc.poNumber && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-indigo-50 shrink-0">
                <GitCompare className="h-4 w-4 text-indigo-600 shrink-0" />
                <p className="text-xs text-indigo-700 flex-1">
                  PO <span className="font-mono font-semibold">{previewDoc.poNumber}</span>
                </p>
                <Link
                  href={`/match-center?po=${encodeURIComponent(previewDoc.poNumber)}`}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  View Match →
                </Link>
              </div>
            )}

            {/* File preview — uses authenticated blob loader */}
            <div className="flex-1 overflow-hidden p-3">
              <FilePreview
                documentId={previewDoc.id}
                mimeType={previewDoc.mimeType}
                filename={previewDoc.originalName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
