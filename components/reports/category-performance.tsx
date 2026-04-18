'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { CategoryPerformanceRow } from '@/types/analytics';

export function CategoryPerformance({ rows }: Readonly<{ rows: CategoryPerformanceRow[] }>) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No category sales in this range.</p>
    );
  }

  const maxRev = Math.max(...rows.map((r) => Number(r.revenue)), 1);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {rows.map((r) => {
          const pct = (Number(r.revenue) / maxRev) * 100;
          return (
            <li key={r.categoryId}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{r.categoryName}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatMoneyAmount(r.revenue)}
                  <span className="ml-2 text-xs">({r.quantitySold} units)</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
