'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { AnalyticsTopProduct } from '@/types/analytics';

type TopProductsProps = {
  products: AnalyticsTopProduct[];
};

export function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No product sales in this range.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Product
            </th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Qty
            </th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId} className="border-b border-border last:border-0">
              <td className="max-w-[200px] truncate px-3 py-2 font-medium">{p.productName}</td>
              <td className="px-3 py-2 tabular-nums">{p.quantitySold}</td>
              <td className="px-3 py-2 tabular-nums">{formatMoneyAmount(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
