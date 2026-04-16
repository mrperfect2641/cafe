'use client';

import { formatMoneyAmount } from '@/lib/format-money';

export type OrdersSummary = {
  totalOrders: number;
  totalRevenue: string;
  pendingOrders: number;
  completedOrders: number;
};

export function OrderSummaryCards({ summary }: Readonly<{ summary: OrdersSummary }>) {
  const cards = [
    { label: 'Total Orders', value: String(summary.totalOrders) },
    { label: 'Total Revenue', value: formatMoneyAmount(summary.totalRevenue) },
    { label: 'Pending Orders', value: String(summary.pendingOrders) },
    { label: 'Completed Orders', value: String(summary.completedOrders) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
