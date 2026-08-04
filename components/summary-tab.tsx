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

    <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 anim-slide-up delay-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="px-5 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white/50 backdrop-blur-md">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-500" />
          Associated Invoice &amp; GRN
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-slate-100/50 backdrop-blur-md">
              <th className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Document Type</th>
              <th className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Document No.</th>
              <th className="px-5 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Date</th>
              <th className="px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Quantity</th>
              <th className="px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Cum. Invoice</th>
              <th className="px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Cum. GRN</th>
              <th className="px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Pending Delivery</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100/80 bg-white hover:bg-slate-50/80 transition-all duration-300 group hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] relative z-0 hover:z-10">
              <td className="px-5 py-3.5 transition-colors duration-300 group-hover:border-slate-200/80">
                <span className="rounded-full bg-teal-100/80 px-2.5 py-1 text-[11px] font-bold text-teal-700 shadow-sm ring-1 ring-teal-600/10">
                  Original PO
                </span>
              </td>
              <td className="px-5 py-3.5 font-mono text-xs text-teal-700 font-bold tracking-tight transition-colors duration-300 group-hover:border-slate-200/80">
                {summary.poNumber}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 transition-colors duration-300 group-hover:border-slate-200/80">—</td>
              <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">—</td>
              <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">0</td>
              <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">0</td>
              <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-800 transition-colors duration-300 group-hover:border-slate-200/80">{formatNumber(summary.statusRow.pendingQty)}</td>
            </tr>

            {summary.associatedDocuments.map((row) => (
              <tr key={row.documentId} className="border-b border-slate-100/80 bg-white hover:bg-slate-50/80 transition-all duration-300 group hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] relative z-0 hover:z-10">
                <td className="px-5 py-3.5 transition-colors duration-300 group-hover:border-slate-200/80">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ring-1 ${
                      row.documentType === 'invoice'
                        ? 'bg-purple-100/80 text-purple-700 ring-purple-600/10'
                        : 'bg-blue-100/80 text-blue-700 ring-blue-600/10'
                    }`}
                  >
                    {row.documentType === 'invoice' ? 'Invoice' : 'GRN'}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800 tracking-tight transition-colors duration-300 group-hover:border-slate-200/80">
                  {row.documentNumber}
                </td>
                <td className="px-5 py-3.5 text-[11px] font-medium text-slate-500 transition-colors duration-300 group-hover:border-slate-200/80">
                  {formatDate(row.documentDate)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">
                  {formatNumber(row.totalQty)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">
                  {row.documentType === 'invoice'
                    ? formatNumber(row.cumulativeInvoicedQty)
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-slate-700 transition-colors duration-300 group-hover:border-slate-200/80">
                  {row.documentType === 'grn'
                    ? formatNumber(row.cumulativeReceivedQty)
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-800 transition-colors duration-300 group-hover:border-slate-200/80">
                  {formatNumber(summary.statusRow.pendingQty)}
                </td>
              </tr>
            ))}

            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 font-semibold border-t-2 border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <td className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-600" colSpan={3}>
                Current Status
              </td>
              <td className="px-5 py-4 text-right font-mono text-xs">
                <span className="text-slate-500 font-medium">Remaining: <span className="font-bold text-slate-700">{formatNumber(summary.statusRow.pendingQty)}</span></span>
              </td>
              <td className="px-5 py-4 text-right font-mono text-xs text-purple-700 font-extrabold text-[13px]">
                {formatNumber(summary.statusRow.totalInvoicedQty)}
              </td>
              <td className="px-5 py-4 text-right font-mono text-xs text-blue-700 font-extrabold text-[13px]">
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
