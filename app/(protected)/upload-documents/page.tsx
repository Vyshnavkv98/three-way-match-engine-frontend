'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadDocument } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProfileMenu } from '@/components/profile-menu';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Truck, Receipt,
  FileImage, FileType, CheckCircle2, AlertCircle, Info,
  ArrowRight, Clock,
} from 'lucide-react';

const DOC_TYPES = [
  {
    value: 'po',
    label: 'Purchase Order',
    short: 'PO',
    desc: 'Original order placed with the vendor. This is the master reference document.',
    icon: FileText,
    ring: 'ring-2 ring-teal-500 border-teal-400',
    idle: 'border-slate-200 hover:border-teal-300',
    iconActive: 'bg-teal-100 text-teal-700',
    iconIdle: 'bg-slate-100 text-slate-500',
    badge: 'bg-teal-100 text-teal-700',
  },
  {
    value: 'grn',
    label: 'Goods Receipt Note',
    short: 'GRN',
    desc: 'Confirms the physical delivery of goods at the warehouse.',
    icon: Truck,
    ring: 'ring-2 ring-blue-500 border-blue-400',
    idle: 'border-slate-200 hover:border-blue-300',
    iconActive: 'bg-blue-100 text-blue-700',
    iconIdle: 'bg-slate-100 text-slate-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'invoice',
    label: 'Invoice',
    short: 'INV',
    desc: "The vendor's bill for goods delivered. Linked to the PO by PO number.",
    icon: Receipt,
    ring: 'ring-2 ring-purple-500 border-purple-400',
    idle: 'border-slate-200 hover:border-purple-300',
    iconActive: 'bg-purple-100 text-purple-700',
    iconIdle: 'bg-slate-100 text-slate-500',
    badge: 'bg-purple-100 text-purple-700',
  },
];

type Stage = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

interface UploadEntry {
  id: string;
  fileName: string;
  docType: string;
  poNumber?: string;
  stage: Stage;
  progress: number;
  error?: string;
  errorCode?: string;
  timestamp: Date;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function UploadDocumentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState('po');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [history, setHistory] = useState<UploadEntry[]>([]);

  const selectedType = DOC_TYPES.find((t) => t.value === docType)!;

  const reset = () => {
    setFile(null);
    setStage('idle');
    setProgress(0);
    setErrorMsg('');
    setErrorCode(undefined);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const entryId = crypto.randomUUID();
    setStage('uploading');
    setErrorMsg('');

    try {
      const result = await uploadDocument(file, docType, (pct) => {
        setProgress(pct);
        if (pct === 100) setStage('parsing');
      });

      setStage('done');
      setHistory((h) => [
        {
          id: entryId,
          fileName: file.name,
          docType,
          poNumber: result.poNumber,
          stage: 'done',
          progress: 100,
          timestamp: new Date(),
        },
        ...h,
      ]);

      toast.success(
        `✅ ${DOC_TYPES.find((t) => t.value === docType)?.label ?? 'Document'} uploaded successfully!\nLinked to PO: ${result.poNumber}`,
        { duration: 5000 },
      );
      if (result.warnings?.length)
        result.warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 6000 }));

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['documents'] }),
        qc.invalidateQueries({ queryKey: ['match', result.poNumber] }),
        qc.invalidateQueries({ queryKey: ['documents', 'dashboard'] }),
      ]);

      setTimeout(reset, 1200);
    } catch (err) {
      const msg  = err instanceof Error ? err.message : 'Upload failed';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (err as any)?.code as string | undefined;
      setStage('error');
      setErrorMsg(msg);
      setErrorCode(code);
      setHistory((h) => [
        {
          id: entryId,
          fileName: file.name,
          docType,
          stage: 'error',
          progress: 0,
          error: msg,
          errorCode: code,
          timestamp: new Date(),
        },
        ...h,
      ]);
    }
  };

  const isBusy = stage === 'uploading' || stage === 'parsing';

  const stageLabel: Record<Stage, string> = {
    idle:      'Upload Document',
    uploading: `Uploading ${progress}%`,
    parsing:   'AI parsing document…',
    done:      'Done!',
    error:     'Retry Upload',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900">Upload Documents</h1>
          <p className="text-xs text-slate-500 mt-0.5">Add POs, GRNs or Invoices for AI parsing and reconciliation</p>
        </div>
        <ProfileMenu />
      </div>

      <div className="flex-1 overflow-auto py-6 px-[8%]">
        <div className="matmin-w-3xl mx-auto flex flex-col gap-6">

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 anim-slide-down">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <strong>Upload order doesn't matter.</strong> You can upload an Invoice before the PO exists.
              Documents are linked by PO number — the match result is always derived from whatever is currently in the database.
            </div>
          </div>

          {/* Upload form card */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Step 1 — Doc type */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold">1</span>
                Choose document type
              </p>
              <div className="grid grid-cols-3 gap-3">
                {DOC_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = docType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setDocType(t.value)}
                      className={cn(
                        'flex flex-col gap-2.5 rounded-xl border-2 p-4 text-left transition-all duration-150',
                        active ? t.ring : t.idle + ' bg-white',
                      )}
                    >
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', active ? t.iconActive : t.iconIdle)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', active ? '' : 'text-slate-700')}>
                          <span className={cn('mr-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-black', t.badge)}>{t.short}</span>
                          {t.label}
                        </p>
                        <p className={cn('text-xs mt-1 leading-relaxed', active ? 'opacity-70' : 'text-slate-400')}>
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — File */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold">2</span>
                Select file
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !isBusy && fileRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && !isBusy && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!isBusy) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all duration-150 select-none',
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  dragOver ? 'border-teal-400 bg-teal-50 scale-[1.005]'
                    : file   ? 'border-teal-300 bg-teal-50/40'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50',
                )}
              >
                {file ? (
                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                      {file.type.startsWith('image/') ? <FileImage className="h-7 w-7" /> : <FileType className="h-7 w-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
                    </div>
                    {!isBusy && <span className="text-xs text-teal-600 font-medium">Change</span>}
                  </div>
                ) : (
                  <>
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl transition-colors', dragOver ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400')}>
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700">{dragOver ? 'Drop it here' : 'Drag & drop or click to browse'}</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPEG, PNG, WebP, TIFF — max 20 MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Progress */}
            {stage !== 'idle' && stage !== 'error' && (
              <div className="px-6 py-5 border-b border-slate-100 anim-slide-down">
                {/* Step indicators */}
                <div className="flex items-center gap-0 mb-5">
                  {[
                    { key: 'uploading', label: 'Uploading',  done: stage === 'parsing' || stage === 'done' },
                    { key: 'parsing',   label: 'AI Parsing', done: stage === 'done' },
                    { key: 'done',      label: 'Complete',   done: false },
                  ].map((step, i) => {
                    const isActive = stage === step.key;
                    const isDone   = step.done;
                    return (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                            isDone   ? 'bg-emerald-500 text-white'
                            : isActive ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                            : 'bg-slate-200 text-slate-400',
                          )}>
                            {isDone
                              ? <CheckCircle2 className="h-4 w-4" />
                              : isActive
                              ? <span className="inline-block h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                              : i + 1}
                          </div>
                          <span className={cn(
                            'text-[10px] font-semibold whitespace-nowrap',
                            isDone ? 'text-emerald-600' : isActive ? 'text-teal-700' : 'text-slate-400',
                          )}>
                            {step.label}
                          </span>
                        </div>
                        {i < 2 && (
                          <div className={cn(
                            'flex-1 h-0.5 mb-5 mx-1 rounded-full transition-colors duration-500',
                            isDone ? 'bg-emerald-400' : 'bg-slate-200',
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="font-semibold">{stageLabel[stage]}</span>
                    {stage === 'uploading' && <span className="tabular-nums font-mono">{progress}%</span>}
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300 ease-out',
                        stage === 'done'     ? 'bg-emerald-500'
                          : stage === 'parsing' ? 'bg-teal-400 progress-stripe'
                          : 'bg-teal-500',
                      )}
                      style={{ width: stage === 'done' || stage === 'parsing' ? '100%' : `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stage message */}
                {stage === 'parsing' && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3 py-2.5 anim-fade-in">
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-500 animate-pulse mt-1 shrink-0" />
                    <p className="text-xs text-teal-700 leading-relaxed">
                      <strong>Gemini AI</strong> is reading your document and extracting structured line items.
                      This usually takes 5–15 seconds…
                    </p>
                  </div>
                )}
                {stage === 'done' && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 anim-fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-semibold">
                      Upload complete — document stored and linked to PO.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="mx-6 my-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 anim-slide-down">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-red-700">Upload failed</p>
                    {errorCode && (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 font-mono text-[11px] font-bold text-red-800 border border-red-200">
                        {errorCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-6 py-4">
              {docType !== 'po' && !file && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Ensure the PO for this {selectedType.label} was already uploaded
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/match-center')}
                  disabled={isBusy}
                >
                  Go to Match Center
                </Button>
                <Button
                  type="submit"
                  loading={isBusy}
                  disabled={!file || stage === 'done'}
                >
                  {stageLabel[stage]}
                </Button>
              </div>
            </div>
          </form>

          {/* Upload history */}
          {history.length > 0 && (
            <div className="flex flex-col gap-2 anim-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Upload History (this session)</p>
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0"
                  >
                    {entry.stage === 'done'
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{entry.fileName}</p>
                      {entry.poNumber && (
                        <p className="text-xs text-slate-400">PO: <span className="font-mono text-teal-700">{entry.poNumber}</span></p>
                      )}
                      {entry.error && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {entry.errorCode && (
                            <span className="rounded-md bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 border border-red-200">
                              {entry.errorCode}
                            </span>
                          )}
                          <p className="text-xs text-red-600">{entry.error}</p>
                        </div>
                      )}
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', DOC_TYPES.find((t) => t.value === entry.docType)?.badge)}>
                      {DOC_TYPES.find((t) => t.value === entry.docType)?.short}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {entry.poNumber && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/match-center?po=${encodeURIComponent(entry.poNumber!)}`)}
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
