'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSkuMasters, createSkuMaster, updateSkuMaster, deleteSkuMaster } from '@/lib/api';
import type { SkuMaster, CreateSkuMasterPayload } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ProfileMenu } from '@/components/profile-menu';
import { cn } from '@/lib/utils';
import {
  Plus, Pencil, Trash2, Search, Database,
  AlertTriangle, CheckCircle2, X, Package,
  Tag, Barcode, Hash, Scale, DollarSign,
  TrendingUp, Percent, Info,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const EMPTY_FORM: CreateSkuMasterPayload = {
  skuErpCode: '', name: '', vendorSkuCode: '', brand: '',
  eanCode: '', hsnCode: '', uom: '',
  agreedRate: undefined, mrp: undefined,
  priceTolerance: undefined, isActive: true,
};

const UOM_OPTIONS = ['PKT', 'KG', 'G', 'L', 'ML', 'EA', 'PCS', 'BOX', 'CTN', 'BAG', 'CASE'];

/* ── Field group label ── */
const GroupLabel = ({ icon: Icon, label, color = 'text-slate-600', bg = 'bg-slate-100' }: {
  icon: React.ElementType; label: string; color?: string; bg?: string;
}) => (
  <div className="flex items-center gap-2 col-span-full mt-1 first:mt-0">
    <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg', bg, color)}>
      <Icon className="h-3.5 w-3.5" />
    </div>
    <span className={cn('text-xs font-bold uppercase tracking-wider', color)}>{label}</span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

/* ── Inline number input ── */
const NumInput = ({
  label, value, onChange, placeholder, hint, prefix, min = '0', step = '0.01',
}: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
  placeholder: string; hint?: string; prefix?: string; min?: string; step?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        step={step}
        min={min}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 text-sm text-slate-900',
          'placeholder-slate-400 shadow-sm transition-colors',
          'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          prefix ? 'pl-7' : 'pl-3',
        )}
      />
    </div>
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

/* ── SKU Form Modal ── */
function SkuFormModal({
  open, onClose, editing, onSuccess,
}: {
  open: boolean; onClose: () => void;
  editing: SkuMaster | null; onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const firstRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreateSkuMasterPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        skuErpCode: editing.skuErpCode, name: editing.name,
        vendorSkuCode: editing.vendorSkuCode ?? '',
        brand: editing.brand ?? '',
        eanCode: editing.eanCode ?? '', hsnCode: editing.hsnCode ?? '',
        uom: editing.uom ?? '', agreedRate: editing.agreedRate,
        mrp: editing.mrp, priceTolerance: editing.priceTolerance,
        isActive: editing.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setTimeout(() => firstRef.current?.focus(), 80);
  }, [open, editing]);

  const setField = (key: keyof CreateSkuMasterPayload, value: string | number | boolean | undefined) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.skuErpCode.trim()) e.skuErpCode = 'ERP code is required';
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.eanCode && !/^\d{8,14}$/.test(form.eanCode.trim()))
      e.eanCode = 'EAN must be 8–14 digits';
    if (form.agreedRate !== undefined && form.agreedRate < 0) e.agreedRate = 'Must be ≥ 0';
    if (form.mrp !== undefined && form.mrp < 0) e.mrp = 'Must be ≥ 0';
    if (form.priceTolerance !== undefined && (form.priceTolerance < 0 || form.priceTolerance > 1))
      e.priceTolerance = 'Must be between 0 and 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateSkuMasterPayload) =>
      editing ? updateSkuMaster(editing.id, payload) : createSkuMaster(payload),
    onSuccess: () => {
      toast.success(editing ? 'SKU updated successfully' : 'SKU created successfully');
      qc.invalidateQueries({ queryKey: ['skuMasters'] });
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      ...form,
      skuErpCode: form.skuErpCode.trim(),
      name: form.name.trim(),
      vendorSkuCode: form.vendorSkuCode?.trim() || undefined,
      brand: form.brand?.trim() || undefined,
      eanCode: form.eanCode?.trim() || undefined,
      hsnCode: form.hsnCode?.trim() || undefined,
      uom: form.uom?.trim() || undefined,
    });
  };

  if (!open) return null;

  const tolerancePct = form.priceTolerance !== undefined
    ? `±${(form.priceTolerance * 100).toFixed(0)}%`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm modal-overlay" onClick={onClose} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="anim-slide-up relative z-10 flex flex-col w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.06]"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
            editing ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600',
          )}>
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">
              {editing ? 'Edit SKU' : 'Add New SKU'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editing
                ? `Updating: ${editing.skuErpCode} — ${editing.name}`
                : 'Fill in the product details. ERP Code and Name are required.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="sku-form" onSubmit={handleSubmit} className="flex flex-col gap-0">
            {/* Section 1 — Identity */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <GroupLabel icon={Tag} label="Product Identity" color="text-teal-700" bg="bg-teal-50" />

              {/* ERP Code */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  ERP Code <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstRef}
                  value={form.skuErpCode}
                  onChange={(e) => setField('skuErpCode', e.target.value)}
                  placeholder="e.g. BIK-BIKANERI-200G"
                  className={cn(
                    'rounded-lg border bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm',
                    'placeholder-slate-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
                    errors.skuErpCode ? 'border-red-400' : 'border-slate-200',
                  )}
                />
                {errors.skuErpCode && <p className="text-[10px] text-red-600 font-medium">{errors.skuErpCode}</p>}
                <p className="text-[10px] text-slate-400">Unique code from ERP / vendor documents</p>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Bikaji Bikaneri Bhujia 200g"
                  className={cn(
                    'rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
                    'placeholder-slate-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
                    errors.name ? 'border-red-400' : 'border-slate-200',
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-600 font-medium">{errors.name}</p>}
              </div>

              {/* Vendor SKU Code */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-orange-500" />
                  Vendor SKU Code
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">KEY FOR MATCHING</span>
                </label>
                <input
                  value={form.vendorSkuCode ?? ''}
                  onChange={(e) => setField('vendorSkuCode', e.target.value)}
                  placeholder="e.g. 18906 or PSM-SPRINGROLLS"
                  className="rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2 text-sm font-mono text-slate-900 shadow-sm placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-colors"
                />
                <p className="text-[10px] text-orange-600 font-medium">
                  The code the vendor uses on their documents (PO/GRN/Invoice). Used to resolve items during 3-way matching.
                </p>
              </div>

              {/* Brand */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  Brand / Manufacturer
                </label>
                <input
                  value={form.brand ?? ''}
                  onChange={(e) => setField('brand', e.target.value)}
                  placeholder="e.g. Bikaji, Haldirams, ITC"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
                <p className="text-[10px] text-slate-400">Manufacturer or brand name for filtering and display</p>
              </div>

              {/* EAN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Barcode className="h-3 w-3" /> EAN Code
                </label>
                <input
                  value={form.eanCode ?? ''}
                  onChange={(e) => setField('eanCode', e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className={cn(
                    'rounded-lg border bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm',
                    'placeholder-slate-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
                    errors.eanCode ? 'border-red-400' : 'border-slate-200',
                  )}
                />
                {errors.eanCode
                  ? <p className="text-[10px] text-red-600 font-medium">{errors.eanCode}</p>
                  : <p className="text-[10px] text-slate-400">8–14 digit barcode (alternate lookup key)</p>}
              </div>

              {/* HSN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Hash className="h-3 w-3" /> HSN Code
                </label>
                <input
                  value={form.hsnCode ?? ''}
                  onChange={(e) => setField('hsnCode', e.target.value)}
                  placeholder="e.g. 21062010"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
                <p className="text-[10px] text-slate-400">Harmonised System Nomenclature (GST classification)</p>
              </div>

              {/* UOM */}
              <div className="flex flex-col gap-1 col-span-full">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Scale className="h-3 w-3" /> Unit of Measure
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {UOM_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setField('uom', form.uom === u ? '' : u)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                        form.uom === u
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700',
                      )}
                    >
                      {u}
                    </button>
                  ))}
                  {/* Custom input */}
                  <input
                    value={UOM_OPTIONS.includes(form.uom ?? '') ? '' : (form.uom ?? '')}
                    onChange={(e) => setField('uom', e.target.value)}
                    placeholder="Custom…"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 w-24 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-colors"
                  />
                </div>
                {form.uom && !UOM_OPTIONS.includes(form.uom) && (
                  <p className="text-[10px] text-teal-600">Custom UOM: <strong>{form.uom}</strong></p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-slate-100" />

            {/* Section 2 — Pricing */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <GroupLabel icon={DollarSign} label="Pricing & Rates" color="text-purple-700" bg="bg-purple-50" />

              <NumInput
                label="Agreed Rate (₹)"
                value={form.agreedRate}
                onChange={(v) => setField('agreedRate', v)}
                placeholder="0.00"
                prefix="₹"
                hint="Contracted unit price with vendor"
              />
              {errors.agreedRate && <p className="text-[10px] text-red-600 col-span-3 -mt-3">{errors.agreedRate}</p>}

              <NumInput
                label="MRP (₹)"
                value={form.mrp}
                onChange={(v) => setField('mrp', v)}
                placeholder="0.00"
                prefix="₹"
                hint="Maximum Retail Price"
              />
              {errors.mrp && <p className="text-[10px] text-red-600 col-span-3 -mt-3">{errors.mrp}</p>}

              {/* Price Tolerance */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Price Tolerance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.priceTolerance ?? ''}
                    onChange={(e) => setField('priceTolerance', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0.05"
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 pr-12 py-2 text-sm text-slate-900 shadow-sm',
                      'placeholder-slate-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
                      errors.priceTolerance ? 'border-red-400' : 'border-slate-200',
                    )}
                  />
                  {tolerancePct && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-600 pointer-events-none">
                      {tolerancePct}
                    </span>
                  )}
                </div>
                {errors.priceTolerance
                  ? <p className="text-[10px] text-red-600 font-medium">{errors.priceTolerance}</p>
                  : <p className="text-[10px] text-slate-400">Fraction 0–1 (0.05 = ±5% allowed)</p>}
              </div>
            </div>

            {/* Pricing preview box */}
            {(form.agreedRate !== undefined || form.mrp !== undefined) && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-3 grid grid-cols-3 gap-4">
                {form.agreedRate !== undefined && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Agreed Rate</p>
                    <p className="text-base font-bold text-purple-900 mt-0.5">
                      ₹{form.agreedRate.toFixed(2)}
                    </p>
                    {form.priceTolerance !== undefined && (
                      <p className="text-[10px] text-purple-600 mt-0.5">
                        Allowed: ₹{(form.agreedRate * (1 - form.priceTolerance)).toFixed(2)} – ₹{(form.agreedRate * (1 + form.priceTolerance)).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
                {form.mrp !== undefined && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">MRP</p>
                    <p className="text-base font-bold text-purple-900 mt-0.5">₹{form.mrp.toFixed(2)}</p>
                  </div>
                )}
                {form.agreedRate !== undefined && form.mrp !== undefined && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Margin</p>
                    <p className="text-base font-bold text-purple-900 mt-0.5">
                      {(((form.mrp - form.agreedRate) / form.mrp) * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-purple-600 mt-0.5">MRP vs agreed rate</p>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="my-5 border-t border-slate-100" />

            {/* Section 3 — Status */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  form.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400',
                )}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Active SKU</p>
                  <p className="text-xs text-slate-500">
                    {form.isActive
                      ? 'This SKU is active and will be used for matching'
                      : 'Inactive SKUs are stored but excluded from matching'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setField('isActive', !form.isActive)}
                role="switch"
                aria-checked={form.isActive}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30',
                  form.isActive ? 'bg-teal-600' : 'bg-slate-300',
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                  form.isActive ? 'translate-x-6' : 'translate-x-1',
                )} />
              </button>
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 anim-slide-down">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Could not save SKU</p>
                  <p className="text-xs text-red-600 mt-0.5">{mutation.error.message}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0 bg-slate-50/60 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Info className="h-3 w-3" />
            <span>Fields marked <span className="text-red-500 font-bold">*</span> are required</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="sku-form"
              loading={mutation.isPending}
              className={editing ? 'bg-blue-600 hover:bg-blue-700' : undefined}
            >
              {editing ? 'Save Changes' : 'Create SKU'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirmation modal ── */
function DeleteModal({ target, onClose, onConfirm, loading }: {
  target: SkuMaster | null; onClose: () => void;
  onConfirm: () => void; loading: boolean;
}) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="anim-scale-in relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.06] overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Delete SKU</h2>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">{target.name}</span>?
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-center gap-2">
                <span className="font-mono text-xs text-teal-700 font-bold">{target.skuErpCode}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 truncate">{target.name}</span>
              </div>
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                This is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>Delete SKU</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function SkuMasterPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SkuMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkuMaster | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data = [], isLoading } = useQuery({
    queryKey: ['skuMasters', search],
    queryFn: () => listSkuMasters(search ? { search } : {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSkuMaster(id),
    onSuccess: () => {
      toast.success('SKU deleted');
      qc.invalidateQueries({ queryKey: ['skuMasters'] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = filter === 'all' ? data
    : filter === 'active' ? data.filter((s) => s.isActive)
    : data.filter((s) => !s.isActive);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (sku: SkuMaster) => { setEditing(sku); setModalOpen(true); };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">SKU Master</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLoading ? '…' : `${data.length} record${data.length !== 1 ? 's' : ''}`}
                {!isLoading && data.length > 0 && (
                  <span className="ml-2 text-emerald-600">
                    · {data.filter((s) => s.isActive).length} active
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-colors w-56"
                placeholder="Search name, ERP code, EAN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all',
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4" /> Add SKU
            </Button>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Database className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">
              {search ? `No SKUs match "${search}"` : 'No SKUs yet. Add your first one.'}
            </p>
            {!search && (
              <Button variant="secondary" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add SKU
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm anim-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {[
                      ['ERP Code', 'text-left'],
                      ['Product Name', 'text-left'],
                      ['Vendor SKU Code', 'text-left'],
                      ['Brand', 'text-left'],
                      ['EAN', 'text-left'],
                      ['HSN', 'text-left'],
                      ['UOM', 'text-left'],
                      ['Agreed Rate', 'text-right'],
                      ['MRP', 'text-right'],
                      ['Tolerance', 'text-right'],
                      ['Margin', 'text-right'],
                      ['Status', 'text-left'],
                      ['', 'text-right'],
                    ].map(([h, align]) => (
                      <th key={String(h)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${align}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sku, i) => {
                    const margin = sku.agreedRate && sku.mrp
                      ? (((sku.mrp - sku.agreedRate) / sku.mrp) * 100)
                      : undefined;
                    return (
                      <tr
                        key={sku.id}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors anim-fade-in group"
                        style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 rounded-md px-2 py-0.5">
                            {sku.skuErpCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 max-w-[200px] truncate">{sku.name}</p>
                        </td>
                        {/* Vendor SKU Code — highlighted as it's the matching key */}
                        <td className="px-4 py-3">
                          {sku.vendorSkuCode ? (
                            <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 rounded-md px-2 py-0.5 border border-orange-200">
                              {sku.vendorSkuCode}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-300 italic">not set</span>
                          )}
                        </td>
                        {/* Brand */}
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {sku.brand ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{sku.eanCode ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{sku.hsnCode ?? '—'}</td>
                        <td className="px-4 py-3">
                          {sku.uom
                            ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{sku.uom}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-800">
                          {sku.agreedRate !== undefined ? `₹${sku.agreedRate.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {sku.mrp !== undefined ? `₹${sku.mrp.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {sku.priceTolerance !== undefined
                            ? <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 font-semibold">
                                ±{(sku.priceTolerance * 100).toFixed(0)}%
                              </span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {margin !== undefined
                            ? <span className={cn(
                                'text-xs font-semibold font-mono',
                                margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600',
                              )}>
                                {margin.toFixed(1)}%
                              </span>
                            : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            sku.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                          )}>
                            {sku.isActive ? <><CheckCircle2 className="h-3 w-3" />Active</> : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(sku)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sku)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <SkuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSuccess={() => setModalOpen(false)}
      />
      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
