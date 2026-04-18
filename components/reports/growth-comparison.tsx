'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { GrowthComparison } from '@/types/analytics';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function PctBadge({ pct }: Readonly<{ pct: number | null }>) {
  if (pct == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        n/a
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400',
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

export function GrowthComparisonCard({ growth }: Readonly<{ growth: GrowthComparison }>) {
  const { todayVsYesterday, rolling7VsPrev7 } = growth;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Today vs yesterday</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Calendar days (local time)</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Today</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoneyAmount(todayVsYesterday.current.revenue)}</p>
            <p className="text-xs text-muted-foreground">{todayVsYesterday.current.orders} orders</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Yesterday</p>
            <p className="text-lg font-medium tabular-nums text-muted-foreground">
              {formatMoneyAmount(todayVsYesterday.previous.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">{todayVsYesterday.previous.orders} orders</p>
          </div>
          <PctBadge pct={todayVsYesterday.revenueChangePct} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Last 7 days vs previous 7</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Rolling windows ending today</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last 7 days</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoneyAmount(rolling7VsPrev7.current.revenue)}</p>
            <p className="text-xs text-muted-foreground">{rolling7VsPrev7.current.orders} orders</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Prior 7 days</p>
            <p className="text-lg font-medium tabular-nums text-muted-foreground">
              {formatMoneyAmount(rolling7VsPrev7.previous.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">{rolling7VsPrev7.previous.orders} orders</p>
          </div>
          <PctBadge pct={rolling7VsPrev7.revenueChangePct} />
        </div>
      </div>
    </div>
  );
}
