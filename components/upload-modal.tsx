'use client';

import { uploadDocument } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Info, FileImage, FileType, Truck, Receipt,
} from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const DOC_TYPES = [
  {
    value: 'po',
    label: 'Purchase Order',
    short: 'PO',
    desc: 'Original order placed with the vendor',
    icon: FileText,
    accent: 'border-teal-300 bg-teal-50 text-teal-700',
    ring: 'ring-2 ring-teal-500 border-teal-500 bg-teal-50',
    pill: 'bg-teal-100 text-teal-700',
  },
  {
    value: 'grn',
    label: 'Goods Receipt Note',
    short: 'GRN',
    desc: 'Confirms physical delivery of goods',
    icon: Truck,
    accent: 'border-blue-300 bg-blue-50 text-blue-700',
    ring: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50',
    pill: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'invoice',
    label: 'Invoice',
    short: 'INV',
    desc: "Vendor's bill for goods delivered",
    icon: Receipt,
    accent: 'border-purple-300 bg-purple-50 text-purple-700',
    ring: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50',
    pill: 'bg-purple-100 text-purple-700',
  },
];

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (poNumber: string) => void;
}

type Stage = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

interface UploadError {
  message: string;
  code?: string;
}

export const UploadModal = ({ open, onClose, onSuccess }: UploadModalProps) => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('po');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStage('idle');
    setErrorMsg('');
    setErrorCode(undefined);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      setStage('uploading');
      setErrorMsg('');
      const result = await uploadDocument(file, docType, (pct) => {
        setProgress(pct);
        if (pct === 100) setStage('parsing');
      });
      setStage('done');
      toast.success(
        `✅ ${DOC_TYPES.find((t) => t.value === docType)?.label ?? 'Document'} uploaded!\nLinked to PO: ${result.poNumber}`,
        { duration: 5000 },
      );
      if (result.warnings?.length)
        result.warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 6000 }));
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['documents'] }),
        qc.invalidateQueries({ queryKey: ['match', result.poNumber] }),
        qc.invalidateQueries({ queryKey: ['summary', result.poNumber] }),
      ]);
      onSuccess?.(result.poNumber);
      setTimeout(handleClose, 900);
    } catch (err) {
      setStage('error');
      const msg  = err instanceof Error ? err.message : 'Upload failed';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (err as any)?.code as string | undefined;
      setErrorMsg(msg);
      setErrorCode(code);
    }
  };

  const isBusy = stage === 'uploading' || stage === 'parsing';
  const selectedType = DOC_TYPES.find((t) => t.value === docType)!;

  const stageLabel: Record<Stage, string> = {
    idle: 'Upload Document',
    uploading: `Uploading ${progress}%`,
    parsing: 'AI parsing…',
    done: 'Done!',
    error: 'Retry Upload',
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Document"
      subtitle="PDF, JPEG, PNG, WebP or TIFF · Max 20 MB · AI extracts line items automatically"
      className="max-w-2xl"
      persistent={isBusy}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* ── Step 1 — Doc type ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white text-[9px] font-bold">1</span>
            Choose document type
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {DOC_TYPES.map((t) => {
              const Icon = t.icon;
              const active = docType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDocType(t.value)}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border-2 p-3.5 text-left transition-all duration-150',
                    active ? t.ring : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', active ? t.pill : 'bg-slate-100 text-slate-500')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', active ? '' : 'text-slate-700')}>
                      {t.label}
                    </p>
                    <p className={cn('text-xs mt-0.5', active ? 'opacity-75' : 'text-slate-400')}>
                      {t.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 2 — File drop ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white text-[9px] font-bold">2</span>
            Select file
          </p>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-150 select-none',
              dragOver
                ? 'border-teal-400 bg-teal-50/70 scale-[1.01]'
                : file
                ? 'border-teal-300 bg-teal-50/40'
                : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50',
            )}
          >
            {file ? (
              <div className="flex items-center gap-4 w-full max-w-xs">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  {file.type.startsWith('image/') ? (
                    <FileImage className="h-6 w-6" />
                  ) : (
                    <FileType className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
                </div>
                <span className="text-xs text-teal-600 font-medium whitespace-nowrap">Change</span>
              </div>
            ) : (
              <>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-colors', dragOver ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400')}>
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {dragOver ? 'Drop it here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, JPEG, PNG, WebP, TIFF — max 20 MB
                  </p>
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

        {/* ── Progress ── */}
        {stage !== 'idle' && stage !== 'error' && (
          <div className="flex flex-col gap-2 anim-slide-down">
            <div className="flex justify-between text-xs text-slate-500">
              <span className="font-medium">{stageLabel[stage]}</span>
              {stage === 'uploading' && <span>{progress}%</span>}
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300 ease-out',
                  stage === 'done'    ? 'bg-emerald-500' :
                  stage === 'parsing' ? 'bg-teal-400 progress-stripe' :
                  'bg-teal-500',
                )}
                style={{ width: stage === 'done' || stage === 'parsing' ? '100%' : `${progress}%` }}
              />
            </div>
            {stage === 'done' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium anim-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                Upload complete — linking to PO…
              </div>
            )}
            {stage === 'parsing' && (
              <p className="text-xs text-teal-600 italic">
                Gemini AI is extracting line items from your document…
              </p>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 anim-slide-down">
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

        {/* ── Hint when non-PO selected ── */}
        {docType !== 'po' && !file && stage === 'idle' && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 anim-fade-in">
            <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Make sure a <strong>Purchase Order</strong> for this {selectedType.label} has already
              been uploaded. Documents are linked by PO number.
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isBusy}
            disabled={!file || stage === 'done'}
          >
            {stageLabel[stage]}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
