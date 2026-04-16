'use client';

import { formatMoneyAmount } from '@/lib/format-money';

type MenuSummaryCardsProps = {
  totalProducts: number;
  totalMenuValue: number;
  topSellingProduct: string;
  lowPerformingProductCount: number;
};

export function MenuSummaryCards({
  totalProducts,
  totalMenuValue,
  topSellingProduct,
  lowPerformingProductCount,
}: Readonly<MenuSummaryCardsProps>) {
  const cards = [
    { label: 'Total products', value: String(totalProducts) },
    { label: 'Total menu value', value: formatMoneyAmount(totalMenuValue) },
    { label: 'Top selling product', value: topSellingProduct || 'No sales data' },
    { label: 'Low performing products', value: String(lowPerformingProductCount) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
