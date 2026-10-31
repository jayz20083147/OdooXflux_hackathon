import React from "react";
import { formatCurrency } from "@/lib/constants";

export type MonthlyDataPoint = {
  month: string;
  revenue: number;
  subsCount: number;
};

export function MonthlyRevenueChart({ data }: { data: MonthlyDataPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);

  return (
    <div className="space-y-4">
      {/* Chart Canvas */}
      <div className="relative flex h-56 flex-col justify-end pt-8 pb-2">
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2 text-[10px] text-muted-foreground/60">
          <div className="flex items-center justify-between border-b border-dashed border-slate-200">
            <span>{formatCurrency(maxRevenue)}</span>
            <span className="text-[9px] uppercase tracking-wider">Peak</span>
          </div>
          <div className="flex items-center justify-between border-b border-dashed border-slate-100">
            <span>{formatCurrency(Math.round(maxRevenue * 0.5))}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/80">
            <span>$0</span>
            <span className="text-[9px] uppercase tracking-wider">Baseline</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex h-full items-end gap-2 sm:gap-4 px-2">
          {data.map((item, idx) => {
            const heightPct = Math.max(6, Math.min(100, Math.round((item.revenue / maxRevenue) * 100)));
            return (
              <div
                key={idx}
                className="group relative flex flex-1 flex-col items-center h-full justify-end"
              >
                {/* Floating tooltip */}
                <div className="absolute -top-10 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:flex flex-col items-center z-20 pointer-events-none transition-all">
                  <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                  <span className="text-[10px] text-slate-300">{item.subsCount} active subs</span>
                </div>

                {/* Bar Pill */}
                <div className="w-full max-w-[46px] rounded-t-lg bg-slate-100/80 flex items-end h-full p-0.5">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-primary via-primary/90 to-teal-400 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                  />
                </div>

                {/* Month label */}
                <span className="mt-2 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Realized billing revenue (trailing 6 months)</span>
        </span>
        <span className="font-mono font-medium text-foreground">
          Peak: {formatCurrency(maxRevenue)}
        </span>
      </div>
    </div>
  );
}

export type PaymentDistributionItem = {
  label: string;
  count: number;
  amount: number;
  color: string;
};

export function PaymentDistributionBar({ items }: { items: PaymentDistributionItem[] }) {
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0) || 1;

  return (
    <div className="space-y-4">
      {/* Segmented bar */}
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
        {items.map((item, idx) => {
          const pct = Math.max(0, (item.amount / totalAmount) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={idx}
              title={`${item.label}: ${formatCurrency(item.amount)} (${item.count} invoices)`}
              style={{ width: `${pct}%`, backgroundColor: item.color }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-90 shadow-xs"
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
        {items.map((item, idx) => {
          const pct = Math.round((item.amount / totalAmount) * 100);
          return (
            <div key={idx} className="flex flex-col rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium truncate">{item.label}</span>
              </div>
              <p className="mt-1 text-sm font-bold font-mono text-foreground">
                {formatCurrency(item.amount)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {item.count} invoices · <span className="font-medium">{pct}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type PlanRevenueItem = {
  planName: string;
  subCount: number;
  monthlyRevenue: number;
};

export function RevenueByPlanBar({ items }: { items: PlanRevenueItem[] }) {
  const maxRevenue = Math.max(...items.map((i) => i.monthlyRevenue), 1);
  const totalMonthlyRevenue = items.reduce((sum, i) => sum + i.monthlyRevenue, 0) || 1;

  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const pct = Math.max(5, Math.round((item.monthlyRevenue / maxRevenue) * 100));
        const sharePct = Math.round((item.monthlyRevenue / totalMonthlyRevenue) * 100);

        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.planName}
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                  {sharePct}% of MRR
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(item.monthlyRevenue)}
                  <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
            </div>

            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
              <div
                style={{ width: `${pct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300"
              />
            </div>

            <p className="text-[11px] text-muted-foreground text-right">
              {item.subCount} active subscriber{item.subCount === 1 ? "" : "s"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
