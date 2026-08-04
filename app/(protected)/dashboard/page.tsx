'use client';

import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProfileMenu } from '@/components/profile-menu';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { DocumentListItem, MatchStatus } from '@/lib/types';
import Link from 'next/link';
import {
  Upload, GitCompare, FileStack, Database,
  FileText, Truck, ReceiptText,
  CheckCircle2, AlertTriangle, AlertCircle, Clock,
  TrendingUp, Package, ArrowRight, RefreshCw,
} from 'lucide-react';

/* ── helpers ── */
const docTypeIcon = (t: DocumentListItem['documentType']) => {
  if (t === 'po') return <FileText className="h-4 w-4 text-teal-600" />;
  if (t === 'grn') return <Truck className="h-4 w-4 text-blue-600" />;
  return <ReceiptText className="h-4 w-4 text-purple-600" />;
};
const docTypePill = (t: DocumentListItem['documentType']) => ({
  po:      'bg-teal-50 text-teal-700',
  grn:     'bg-blue-50 text-blue-700',
  invoice: 'bg-purple-50 text-purple-700',
}[t]);
const docTypeLabel = (t: DocumentListItem['documentType']) => ({
  po: 'PO', grn: 'GRN', invoice: 'Invoice',
}[t]);

const statusIcon = (s: DocumentListItem['status']) => {
  if (s === 'parsed')   return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (s === 'parsing')  return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  if (s === 'failed')   return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  return <Clock className="h-3.5 w-3.5 text-slate-400" />;
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  delay?: string;
}
const StatCard = ({ label, value, icon, bg, border, delay }: StatCardProps) => (
  <div className={cn('anim-slide-up rounded-2xl border bg-white p-5 flex items-start gap-4 shadow-sm card-lift', border, delay)}>
    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', bg)}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
    </div>
  </div>
);

const QUICK_ACTIONS = [
  { href: '/upload-documents', icon: Upload,    label: 'Upload Document',  desc: 'Add a new PO, GRN or Invoice',   color: 'bg-teal-600 hover:bg-teal-700 text-white' },
  { href: '/match-center',     icon: GitCompare, label: 'Match Center',     desc: 'Search and reconcile by PO',     color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  { href: '/documents',        icon: FileStack,  label: 'Browse Documents', desc: 'View all uploaded documents',    color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { href: '/sku-master',       icon: Database,   label: 'SKU Master',       desc: 'Manage product catalogue',       color: 'bg-purple-600 hover:bg-purple-700 text-white' },
];

export default function DashboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['documents', 'dashboard'],
    queryFn: () => listDocuments({ page: 1, limit: 50 }),
  });

  const docs = data?.data ?? [];

  /* ── derived counts ── */
  const total    = data?.pagination.total ?? 0;
  const pos      = docs.filter((d) => d.documentType === 'po').length;
  const grns     = docs.filter((d) => d.documentType === 'grn').length;
  const invoices = docs.filter((d) => d.documentType === 'invoice').length;
  const parsed   = docs.filter((d) => d.status === 'parsed').length;
  const failed   = docs.filter((d) => d.status === 'failed').length;
  const parsing  = docs.filter((d) => d.status === 'parsing').length;

  /* recent 8 */
  const recent = [...docs]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 8);

  const stats: StatCardProps[] = [
    { label: 'Purchase Orders', value: pos,      icon: <FileText   className="h-5 w-5 text-teal-600"   />, bg: 'bg-teal-50',   border: 'border-teal-200',   delay: 'delay-50'  },
    { label: 'Invoices',        value: invoices, icon: <ReceiptText className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-200', delay: 'delay-100' },
    { label: 'GRNs',            value: grns,     icon: <Truck       className="h-5 w-5 text-blue-600"   />, bg: 'bg-blue-50',   border: 'border-blue-200',   delay: 'delay-150' },
    { label: 'Parsed',          value: parsed,   icon: <CheckCircle2 className="h-5 w-5 text-emerald-600"/>, bg: 'bg-emerald-50',border: 'border-emerald-200',delay: 'delay-200' },
    { label: 'Processing',      value: parsing,  icon: <Clock        className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50',  border: 'border-amber-200',  delay: 'delay-250' },
    { label: 'Failed',          value: failed,   icon: <AlertCircle  className="h-5 w-5 text-red-600"   />, bg: 'bg-red-50',    border: 'border-red-200',    delay: 'delay-300' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Procurement reconciliation overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <Link href="/upload-documents">
            <Button size="sm">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
          <ProfileMenu />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">

        {/* Stat cards */}
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner className="h-8 w-8" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'anim-slide-up flex flex-col gap-2.5 rounded-2xl p-5 transition-all duration-150 shadow-sm card-lift',
                  color,
                )}
              >
                <Icon className="h-6 w-6 opacity-90" />
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 opacity-60 self-end" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent uploads */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Uploads</p>
            <Link href="/documents" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
          ) : recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              <Link href="/upload-documents">
                <Button variant="secondary" size="sm" className="mt-3">
                  <Upload className="h-4 w-4" /> Upload your first document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Type', 'Document', 'PO Number', 'Vendor', 'Items', 'Status', 'Uploaded'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors anim-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', docTypePill(doc.documentType))}>
                          {docTypeIcon(doc.documentType)}
                          {docTypeLabel(doc.documentType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-medium text-slate-800 truncate text-xs">{doc.originalName}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-teal-700">
                        {doc.poNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">
                        {doc.vendorName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-center">
                        {doc.itemCount ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          {statusIcon(doc.status)}
                          <span className="capitalize">{doc.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(doc.uploadedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Go to Match Center CTA */}
        {!isLoading && docs.length > 0 && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex items-center justify-between anim-slide-up">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <GitCompare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-900">Ready to reconcile?</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Go to Match Center and search by PO number to view the full three-way match result.
                </p>
              </div>
            </div>
            <Link href="/match-center">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm whitespace-nowrap">
                Open Match Center
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
