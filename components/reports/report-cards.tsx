'use client';

import { useMemo } from 'react';
import { formatMoneyAmount } from '@/lib/format-money';

type ReportCardsProps = {
  revenue: string;
  totalOrders: number;
  avgOrderValue: string;
};

export function ReportCards({ revenue, totalOrders, avgOrderValue }: ReportCardsProps) {
  const cards = useMemo(
    () => [
      { label: 'Total revenue', value: formatMoneyAmount(revenue) },
      { label: 'Total orders', value: String(totalOrders) },
      { label: 'Avg order value', value: formatMoneyAmount(avgOrderValue) },
    ],
    [revenue, totalOrders, avgOrderValue],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {c.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
