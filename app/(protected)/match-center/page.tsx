'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { getMatch, getSummary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { MismatchBanner } from '@/components/mismatch-banner';
import { ItemGrid } from '@/components/item-grid';
import { UploadModal } from '@/components/upload-modal';
import { SummaryTab } from '@/components/summary-tab';
import { DocumentDetailPanel } from '@/components/document-detail-panel';
import { DocPreviewDrawer } from '@/components/doc-preview-drawer';
import type { DrawerDoc } from '@/components/doc-preview-drawer';
import { ProfileMenu } from '@/components/profile-menu';
import { formatDate, cn } from '@/lib/utils';
import type { LinkedDocument } from '@/lib/types';
import {
  Search, Upload, RefreshCw,
  FileText, Truck, ReceiptText, BarChart3,
  GitCompare, Eye, ArrowRight,
  FileUp, ScanLine, CheckCircle2,
} from 'lucide-react';

type Tab = 'po' | 'fulfillment' | 'delivery' | 'summary';

const TIPS = [
  { icon: FileUp,       text: 'Upload a PO first — it becomes the master reference' },
  { icon: ScanLine,     text: 'AI extracts line items from PDFs and images automatically' },
  { icon: GitCompare,   text: 'GRNs and Invoices are linked by PO number' },
  { icon: CheckCircle2, text: 'Quantity, price and date mismatches are flagged instantly' },
];

/* ── Small "Preview Doc" button ── */
const PreviewBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-all duration-150"
  >
    <Eye className="h-3.5 w-3.5" />
    Preview Doc
  </button>
);

function MatchCenterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPo = searchParams.get('po') ?? '';

  const [poInput, setPoInput]       = useState(initialPo);
  const [poNumber, setPoNumber]     = useState(initialPo);
  const [activeTab, setActiveTab]   = useState<Tab>('po');
  const [activeSubDoc, setActiveSubDoc] = useState<LinkedDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [drawerDoc, setDrawerDoc]   = useState<DrawerDoc | null>(null);

  /* ── Queries ── */
  const matchQuery = useQuery({
    queryKey: ['match', poNumber],
    queryFn:  () => getMatch(poNumber),
    enabled:  !!poNumber,
  });
  const summaryQuery = useQuery({
    queryKey: ['summary', poNumber],
    queryFn:  () => getSummary(poNumber),
    enabled:  !!poNumber && activeTab === 'summary',
  });

  const match    = matchQuery.data;
  const linked   = match?.linkedDocuments ?? [];
  const poDoc    = linked.find((d) => d.documentType === 'po') ?? null;
  const grns     = linked.filter((d) => d.documentType === 'grn');
  const invoices = linked.filter((d) => d.documentType === 'invoice');

  /* ── Handlers ── */
  const openDrawer = (doc: LinkedDocument) =>
    setDrawerDoc({ documentId: doc.documentId, documentType: doc.documentType,
                   documentNumber: doc.documentNumber, documentDate: doc.documentDate,
                   poNumber });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = poInput.trim();
    if (!trimmed) return;
    setPoNumber(trimmed);
    setActiveTab('po');
    setActiveSubDoc(null);
    router.replace(`/match-center?po=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setPoNumber('');
    setPoInput('');
    setActiveSubDoc(null);
    router.replace('/match-center');
  };

  const handleUploadSuccess = (po: string) => {
    setPoNumber(po);
    setPoInput(po);
    matchQuery.refetch();
    router.replace(`/match-center?po=${encodeURIComponent(po)}`);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'fulfillment') setActiveSubDoc(invoices[0] ?? null);
    else if (tab === 'delivery') setActiveSubDoc(grns[0] ?? null);
    else setActiveSubDoc(null);
  };

  useEffect(() => {
    if (activeTab === 'fulfillment' && !activeSubDoc && invoices.length > 0) setActiveSubDoc(invoices[0]);
    if (activeTab === 'delivery'    && !activeSubDoc && grns.length > 0)     setActiveSubDoc(grns[0]);
  }, [activeTab, invoices, grns, activeSubDoc]);

  /* ── Tab definitions ── */
  const tabs: { id: Tab; icon: React.ElementType; label: string; count?: number }[] = [
    { id: 'po',          icon: FileText,    label: 'Purchase Order', count: poDoc ? 1 : 0 },
    { id: 'fulfillment', icon: ReceiptText, label: 'Fulfillment',    count: invoices.length },
    { id: 'delivery',    icon: Truck,       label: 'Delivery',       count: grns.length },
    { id: 'summary',     icon: BarChart3,   label: 'Summary' },
  ];

  const tabCls = (id: Tab) => cn(
    'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-150 select-none',
    activeTab === id
      ? 'border-teal-600 text-teal-700'
      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
  );

  /* ── Sub-doc pill with inline eye ── */
  const SubPill = ({ doc, active, prefix }: { doc: LinkedDocument; active: boolean; prefix: string }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setActiveSubDoc(doc)}
        className={cn(
          'rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-150',
          active
            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400 hover:text-teal-700',
        )}
      >
        {prefix}: {doc.documentNumber} · {formatDate(doc.documentDate)}
      </button>
      <button
        onClick={() => openDrawer(doc)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-colors"
        title="Preview"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ══ TOP BAR — adapts based on whether a PO is loaded ══ */}
      <div className={cn(
        'flex items-center gap-3 border-b border-slate-200 bg-white px-5 shrink-0 transition-all duration-200',
        poNumber ? 'py-3' : 'py-3.5',
      )}>
        {/* Title / icon */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GitCompare className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">Match Center</span>
        </div>

        {/* ── Compact search only visible after a PO is loaded ── */}
        {poNumber && (
          <>
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-colors"
                  placeholder="Change PO number…"
                  value={poInput}
                  onChange={(e) => setPoInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">Go</Button>
            </form>

            {/* Current PO badge */}
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">PO</span>
              <span className="text-sm font-mono font-bold text-indigo-800">{poNumber}</span>
              <button
                onClick={handleClear}
                className="ml-1 h-4 w-4 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 transition-colors text-xs leading-none"
                title="Clear search"
              >
                ✕
              </button>
            </div>

            {match && <StatusBadge status={match.status} />}

            <button
              onClick={() => matchQuery.refetch()}
              title="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', matchQuery.isFetching && 'animate-spin')} />
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button onClick={() => setUploadOpen(true)} size="sm" variant={poNumber ? 'secondary' : 'primary'}>
            <Upload className="h-4 w-4" />
            {poNumber ? 'Upload' : 'Upload Document'}
          </Button>
          <ProfileMenu />
        </div>
      </div>

      {/* ══ TABS — only when PO is loaded ══ */}
      {poNumber && (
        <div className="flex border-b border-slate-200 bg-white px-5 gap-0 shrink-0 anim-slide-down overflow-x-auto">
          {tabs.map(({ id, icon: Icon, label, count }) => (
            <button key={id} className={tabCls(id)} onClick={() => switchTab(id)}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
              {count !== undefined && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  activeTab === id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500',
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══ BODY ══ */}
      <div className="flex-1 overflow-auto">

        {/* ── EMPTY STATE — beautiful full-page search ── */}
        {!poNumber && (
          <div className="flex flex-col items-center justify-center min-h-full py-16 px-6 anim-fade-in">
            {/* Hero section */}
            <div className="flex flex-col items-center gap-5 text-center max-w-lg mb-10">
              {/* Icon */}
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-2xl shadow-indigo-200 anim-bounce-in">
                  <GitCompare className="h-10 w-10" />
                </div>
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-3xl ring-4 ring-indigo-100 scale-125 pointer-events-none" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Match Center</h1>
                <p className="text-slate-500 mt-2 leading-relaxed">
                  Enter a Purchase Order number to instantly load the full three-way match —
                  PO, GRNs, Invoices, and reconciliation status.
                </p>
              </div>

              {/* ── BIG SEARCH BOX ── */}
              <form
                onSubmit={handleSearch}
                className="w-full max-w-md mt-2"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    className={cn(
                      'w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-36 py-4',
                      'text-base text-slate-900 placeholder-slate-400',
                      'shadow-lg shadow-slate-100',
                      'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10',
                      'transition-all duration-200',
                    )}
                    placeholder="e.g. PO-2024-001234"
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!poInput.trim()}
                    className={cn(
                      'absolute right-2 flex items-center gap-2 rounded-xl px-5 py-2.5',
                      'text-sm font-bold text-white transition-all duration-150',
                      'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                      'disabled:bg-slate-300 disabled:cursor-not-allowed',
                      'shadow-md shadow-indigo-200',
                    )}
                  >
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Press Enter or click Search to load the match result
                </p>
              </form>
            </div>

            {/* ── Tips grid ── */}
            <div className="w-full max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
                How it works
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIPS.map(({ icon: Icon, text }, i) => (
                  <div
                    key={i}
                    className="anim-slide-up flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Or upload first ── */}
            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-16 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px w-16 bg-slate-200" />
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
            >
              <Upload className="h-4 w-4" />
              Upload a document first
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {poNumber && matchQuery.isLoading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-slate-400">
              Loading match for <strong className="text-slate-700">{poNumber}</strong>…
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {matchQuery.isError && (
          <div className="m-5 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm anim-slide-down">
            {matchQuery.error instanceof Error ? matchQuery.error.message : 'Failed to load match data'}
          </div>
        )}

        {/* ── PO Tab ── */}
        {poNumber && !matchQuery.isLoading && activeTab === 'po' && match && (
          <div className="tab-content p-5 flex flex-col gap-5">
            <MismatchBanner violations={match.violations} />
            {poDoc ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    PO: {poDoc.documentNumber}
                    {poDoc.documentDate && (
                      <span className="ml-2 font-normal">· {formatDate(poDoc.documentDate)}</span>
                    )}
                  </p>
                  <PreviewBtn onClick={() => openDrawer(poDoc)} />
                </div>
                <DocumentDetailPanel documentId={poDoc.documentId} documentType="po" itemResults={match.itemResults} />
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-dashed border-slate-300 p-8 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No Purchase Order uploaded yet for <strong>{poNumber}</strong></p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload PO
                </Button>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Line Items</p>
              <ItemGrid items={match.itemResults} />
            </div>
          </div>
        )}

        {/* ── Fulfillment Tab ── */}
        {poNumber && !matchQuery.isLoading && activeTab === 'fulfillment' && match && (
          <div className="tab-content p-5 flex flex-col gap-5">
            <MismatchBanner violations={match.violations.filter((v) => v.code !== 'grn_qty_exceeds_po_qty')} />
            {invoices.length > 0 ? (
              <>
                <div className="flex gap-2 flex-wrap items-center">
                  {invoices.map((inv) => (
                    <SubPill key={inv.documentId} doc={inv} active={activeSubDoc?.documentId === inv.documentId} prefix="Invoice" />
                  ))}
                </div>
                {activeSubDoc ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Invoice: {activeSubDoc.documentNumber}
                        {activeSubDoc.documentDate && <span className="ml-2 font-normal">· {formatDate(activeSubDoc.documentDate)}</span>}
                      </p>
                      <PreviewBtn onClick={() => openDrawer(activeSubDoc)} />
                    </div>
                    <DocumentDetailPanel documentId={activeSubDoc.documentId} documentType="invoice" itemResults={match.itemResults} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20"><Spinner className="h-5 w-5" /></div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-white border border-dashed border-slate-300 p-8 text-center">
                <ReceiptText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No invoices linked to <strong>{poNumber}</strong> yet.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload Invoice
                </Button>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Line Items</p>
              <ItemGrid items={match.itemResults} />
            </div>
          </div>
        )}

        {/* ── Delivery Tab ── */}
        {poNumber && !matchQuery.isLoading && activeTab === 'delivery' && match && (
          <div className="tab-content p-5 flex flex-col gap-5">
            <MismatchBanner violations={match.violations.filter((v) => v.code === 'grn_qty_exceeds_po_qty')} />
            {grns.length > 0 ? (
              <>
                <div className="flex gap-2 flex-wrap items-center">
                  {grns.map((grn) => (
                    <SubPill key={grn.documentId} doc={grn} active={activeSubDoc?.documentId === grn.documentId} prefix="GRN" />
                  ))}
                </div>
                {activeSubDoc ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        GRN: {activeSubDoc.documentNumber}
                        {activeSubDoc.documentDate && <span className="ml-2 font-normal">· {formatDate(activeSubDoc.documentDate)}</span>}
                      </p>
                      <PreviewBtn onClick={() => openDrawer(activeSubDoc)} />
                    </div>
                    <DocumentDetailPanel documentId={activeSubDoc.documentId} documentType="grn" itemResults={match.itemResults} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20"><Spinner className="h-5 w-5" /></div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-white border border-dashed border-slate-300 p-8 text-center">
                <Truck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No GRNs linked to <strong>{poNumber}</strong> yet.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload GRN
                </Button>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Line Items</p>
              <ItemGrid items={match.itemResults} />
            </div>
          </div>
        )}

        {/* ── Summary Tab ── */}
        {poNumber && activeTab === 'summary' && (
          <div className="tab-content p-5">
            {summaryQuery.isLoading && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-slate-400">Generating summary…</p>
              </div>
            )}
            {summaryQuery.isError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {String(summaryQuery.error)}
              </div>
            )}
            {summaryQuery.data && (
              <div className="flex flex-col gap-5">
                {linked.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Preview:</span>
                    {linked.map((doc) => (
                      <button
                        key={doc.documentId}
                        onClick={() => openDrawer(doc)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        {doc.documentType === 'po' ? `PO: ${doc.documentNumber}`
                          : doc.documentType === 'grn' ? `GRN: ${doc.documentNumber}`
                          : `Invoice: ${doc.documentNumber}`}
                      </button>
                    ))}
                  </div>
                )}
                <SummaryTab summary={summaryQuery.data} />
              </div>
            )}
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
      <DocPreviewDrawer doc={drawerDoc} onClose={() => setDrawerDoc(null)} />
    </div>
  );
}

export default function MatchCenterPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
      <MatchCenterInner />
    </Suspense>
  );
}
