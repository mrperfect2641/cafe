'use client';

import { formatMoneyAmount } from '@/lib/format-money';

type DashboardCardsProps = {
  revenueToday: string;
  ordersToday: number;
  avgOrderValue: string;
  pendingOrders: number;
};

export function DashboardCards({
  revenueToday,
  ordersToday,
  avgOrderValue,
  pendingOrders,
}: Readonly<DashboardCardsProps>) {
  const cards = [
    { label: 'Revenue today', value: formatMoneyAmount(revenueToday) },
    { label: 'Orders today', value: String(ordersToday) },
    { label: 'Avg order value', value: formatMoneyAmount(avgOrderValue) },
    { label: 'Pending orders', value: String(pendingOrders) },
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
