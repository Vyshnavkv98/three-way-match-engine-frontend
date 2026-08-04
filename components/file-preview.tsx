'use client';

import { getDocumentFileUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useState, useEffect, useRef } from 'react';
import {
  ZoomIn, ZoomOut, ExternalLink, Download,
  RotateCw, Maximize2, Minimize2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  documentId: string;
  mimeType?: string;
  filename?: string;
}

/**
 * Build the authenticated file URL.
 * Since <iframe>/<img> can't send Authorization headers,
 * we append ?token=<jwt> so the backend can read it from the query string.
 */
function buildFileUrl(documentId: string): string {
  const base  = getDocumentFileUrl(documentId);
  const token = getToken();
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export const FilePreview = ({ documentId, mimeType, filename }: FilePreviewProps) => {
  const [zoom, setZoom]             = useState(100);
  const [rotation, setRotation]     = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading]       = useState(true);
  const containerRef                = useRef<HTMLDivElement>(null);

  const url     = buildFileUrl(documentId);
  const isImage = mimeType?.startsWith('image/');
  const isPdf   = mimeType === 'application/pdf';

  useEffect(() => { setLoading(true); }, [documentId]);

  const toggleFullscreen = () => {
    if (!fullscreen) containerRef.current?.requestFullscreen?.().catch(() => {});
    else             document.exitFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(300, z + 10));
      if (e.key === '-')                  setZoom((z) => Math.max(25,  z - 10));
      if (e.key === '0')                  setZoom(100);
      if (e.key === 'r' && isImage)       setRotation((r) => (r + 90) % 360);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isImage]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white rounded-xl overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
        <button onClick={() => setZoom((z) => Math.max(25, z - 10))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors" title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-0.5">
          <input type="number" value={zoom} min={25} max={300}
            onChange={(e) => { const v = Number(e.target.value); if (v >= 25 && v <= 300) setZoom(v); }}
            className="w-12 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-center text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 tabular-nums"
          />
          <span className="text-xs text-slate-400">%</span>
        </div>
        <button onClick={() => setZoom((z) => Math.min(300, z + 10))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors" title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setZoom(100)}
          className="flex h-7 items-center rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors">
          Reset
        </button>
        {isImage && (
          <button onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors ml-1" title="Rotate">
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex-1" />
        <a href={url} download={filename ?? `document-${documentId}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors" title="Download">
          <Download className="h-3.5 w-3.5" />
        </a>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors" title="Open in new tab">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button onClick={toggleFullscreen}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Preview ── */}
      <div className="relative flex-1 overflow-auto bg-[#f0f0f0] flex items-start justify-center p-3">
        {loading && (isPdf || isImage) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f0f0f0] z-10">
            <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
            <p className="text-xs text-slate-400 font-medium">Loading document…</p>
          </div>
        )}

        {isPdf && (
          <iframe
            key={url}
            src={url}
            title="Document preview"
            onLoad={() => setLoading(false)}
            className="rounded-lg shadow-md bg-white"
            style={{ width: `${zoom}%`, minHeight: fullscreen ? '100vh' : '600px', border: 'none' }}
          />
        )}

        {isImage && (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={url}
              src={url}
              alt="Document"
              onLoad={() => setLoading(false)}
              className="rounded-lg shadow-md object-contain block"
              style={{
                width: `${zoom}%`, maxWidth: '100%',
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        )}

        {!isPdf && !isImage && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
            <p className="text-sm font-semibold text-slate-700">Preview not available</p>
            <p className="text-xs">{mimeType ?? 'Unknown file type'}</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
              <ExternalLink className="h-4 w-4" /> Open / Download
            </a>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-slate-100 bg-slate-50 shrink-0">
        <span className="text-[10px] text-slate-400">
          <kbd className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px]">+</kbd>{' '}
          <kbd className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px]">-</kbd> zoom
          {isImage && <>{' · '}<kbd className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px]">R</kbd> rotate</>}
          {' · '}<kbd className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px]">0</kbd> reset
        </span>
        <span className="ml-auto text-[10px] text-slate-400 font-mono">{zoom}%</span>
      </div>
    </div>
  );
};
