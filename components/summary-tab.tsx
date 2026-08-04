import type { SummaryResult } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { DollarSign, TrendingUp, Package } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  delay?: string;
}

const StatCard = ({ label, value, icon, accent, iconBg, delay }: StatCardProps) => (
  <div
    className={`anim-slide-up ${delay ?? ''} rounded-2xl border bg-white p-5 flex items-start gap-4 shadow-sm card-lift ${accent}`}
  >
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
    </div>
  </div>
);

export const SummaryTab = ({ summary }: { summary: SummaryResult }) => (
  <div className="flex flex-col gap-6 anim-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="PO Amount"
        value={formatCurrency(summary.poAmount)}
        icon={<DollarSign className="h-5 w-5 text-teal-600" />}
        accent="border-teal-200"
        iconBg="bg-teal-50"
        delay="delay-50"
      />
      <StatCard
        label="Total Invoiced"
        value={formatCurrency(summary.totalInvoiced)}
        icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        accent="border-purple-200"
        iconBg="bg-purple-50"
        delay="delay-100"
      />
      <StatCard
        label="Total Received"
        value={formatNumber(summary.totalReceived)}
        icon={<Package className="h-5 w-5 text-blue-600" />}
        accent="border-blue-200"
        iconBg="bg-blue-50"
        delay="delay-150"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm anim-slide-up delay-200">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-sm font-bold text-slate-700">Associated Invoice &amp; GRN</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Document Type</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Document No.</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Date</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Quantity</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Cum. Invoice</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Cum. GRN</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Pending Delivery</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3">
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                  Original PO
                </span>
              </td>
              <td className="px-5 py-3 font-mono text-xs text-teal-700 font-semibold">
                {summary.poNumber}
              </td>
              <td className="px-5 py-3 text-xs text-slate-500">—</td>
              <td className="px-5 py-3 text-right font-mono text-xs">—</td>
              <td className="px-5 py-3 text-right font-mono text-xs">0</td>
              <td className="px-5 py-3 text-right font-mono text-xs">0</td>
              <td className="px-5 py-3 text-right font-mono text-xs">{formatNumber(summary.statusRow.pendingQty)}</td>
            </tr>

            {summary.associatedDocuments.map((row) => (
              <tr key={row.documentId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.documentType === 'invoice'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {row.documentType === 'invoice' ? 'Invoice' : 'GRN'}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                  {row.documentNumber}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {formatDate(row.documentDate)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs">
                  {formatNumber(row.totalQty)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs">
                  {row.documentType === 'invoice'
                    ? formatNumber(row.cumulativeInvoicedQty)
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs">
                  {row.documentType === 'grn'
                    ? formatNumber(row.cumulativeReceivedQty)
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs">
                  {formatNumber(summary.statusRow.pendingQty)}
                </td>
              </tr>
            ))}

            <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
              <td className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500" colSpan={3}>
                Current Status
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs">
                <span className="text-slate-400">Remaining: {formatNumber(summary.statusRow.pendingQty)}</span>
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs text-purple-700 font-bold">
                {formatNumber(summary.statusRow.totalInvoicedQty)}
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs text-blue-700 font-bold">
                {formatNumber(summary.statusRow.totalReceivedQty)}
              </td>
              <td className="px-5 py-3 text-right">
                <StatusBadge status={summary.statusRow.status} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
