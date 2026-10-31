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
      <div className="flex h-52 items-end gap-3 pt-6 pb-2">
        {data.map((item, idx) => {
          const heightPct = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
          return (
            <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
              {/* Tooltip on hover */}
              <div className="absolute -top-7 hidden rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md group-hover:block whitespace-nowrap z-10">
                {formatCurrency(item.revenue)} ({item.subsCount} subs)
              </div>
              
              {/* Bar */}
              <div className="w-full max-w-[42px] rounded-t-md bg-slate-100 flex items-end h-full">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary/90"
                />
              </div>

              {/* Month label */}
              <span className="mt-2 text-xs font-medium text-muted-foreground">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
        <span>Historical 6-Month Collections</span>
        <span className="font-medium text-foreground">Peak: {formatCurrency(maxRevenue)}</span>
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
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
        {items.map((item, idx) => {
          const pct = Math.max(0, (item.amount / totalAmount) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={idx}
              title={`${item.label}: ${formatCurrency(item.amount)} (${item.count} invoices)`}
              style={{ width: `${pct}%`, backgroundColor: item.color }}
              className="h-full transition-all duration-300 hover:opacity-90"
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
        {items.map((item, idx) => {
          const pct = Math.round((item.amount / totalAmount) * 100);
          return (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold">{formatCurrency(item.amount)}</p>
              <p className="text-[11px] text-muted-foreground">
                {item.count} inv · {pct}%
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

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct = Math.max(6, Math.round((item.monthlyRevenue / maxRevenue) * 100));
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{item.planName}</span>
              <span className="text-muted-foreground">
                <strong className="font-semibold text-foreground">{formatCurrency(item.monthlyRevenue)}</strong>/mo ({item.subCount} active)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className="h-full rounded-full bg-primary/80 transition-all duration-300"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

