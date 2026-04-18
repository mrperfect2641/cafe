'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { ProductMatrixItem, ProductMatrixQuadrant } from '@/types/analytics';
import { cn } from '@/lib/utils';

const QUADRANT_META: Record<
  ProductMatrixQuadrant,
  { label: string; description: string; className: string }
> = {
  stars: {
    label: 'Stars',
    description: 'Strong volume & revenue — protect and promote.',
    className: 'border-emerald-500/40 bg-emerald-500/10',
  },
  cash_cows: {
    label: 'Cash cows',
    description: 'High revenue, lower volume — premium or high-ticket items.',
    className: 'border-violet-500/40 bg-violet-500/10',
  },
  improve: {
    label: 'Improve',
    description: 'Popular but under-monetized — pricing, bundles, or upsell.',
    className: 'border-amber-500/40 bg-amber-500/10',
  },
  remove: {
    label: 'Remove / rethink',
    description: 'Low revenue & low volume vs peers — simplify the menu.',
    className: 'border-rose-500/40 bg-rose-500/10',
  },
};

function QuadrantColumn({
  quadrant,
  items,
}: Readonly<{ quadrant: ProductMatrixQuadrant; items: ProductMatrixItem[] }>) {
  const meta = QUADRANT_META[quadrant];
  return (
    <div className={cn('flex flex-col rounded-xl border-2 p-4', meta.className)}>
      <h4 className="font-semibold tracking-tight">{meta.label}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
      <ul className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          items.map((p) => (
            <li
              key={p.productId}
              className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
            >
              <div className="font-medium leading-snug">{p.productName}</div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{p.quantitySold} sold</span>
                <span>{formatMoneyAmount(p.revenue)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function ProductPerformanceMatrix({ items }: Readonly<{ items: ProductMatrixItem[] }>) {
  const grouped = {
    stars: items.filter((i) => i.quadrant === 'stars'),
    cash_cows: items.filter((i) => i.quadrant === 'cash_cows'),
    improve: items.filter((i) => i.quadrant === 'improve'),
    remove: items.filter((i) => i.quadrant === 'remove'),
  };

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No product sales in this date range — matrix appears once items sell.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Split by median revenue & units in this range (profit approximated from sales; no COGS in data).
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuadrantColumn quadrant="stars" items={grouped.stars} />
        <QuadrantColumn quadrant="cash_cows" items={grouped.cash_cows} />
        <QuadrantColumn quadrant="improve" items={grouped.improve} />
        <QuadrantColumn quadrant="remove" items={grouped.remove} />
      </div>
    </div>
  );
}
