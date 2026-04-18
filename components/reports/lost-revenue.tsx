'use client';

import type { LostRevenueRow } from '@/types/analytics';
import { PackageX, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LostRevenuePanel({ rows }: Readonly<{ rows: LostRevenueRow[] }>) {
  const oos = rows.filter((r) => r.kind === 'out_of_stock');
  const cold = rows.filter((r) => r.kind === 'cold');

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No out-of-stock or cold items detected — nice work keeping the menu moving.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {oos.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <PackageX className="h-4 w-4 text-rose-400" />
            Out of stock
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">
              {oos.length}
            </span>
          </div>
          <ul className="space-y-2">
            {oos.map((r) => (
              <li
                key={r.productId}
                className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium">{r.productName}</span>
                <p className="text-xs text-muted-foreground">{r.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {cold.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Snowflake className="h-4 w-4 text-sky-400" />
            Unsold (7+ days)
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
              {cold.length}
            </span>
          </div>
          <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {cold.slice(0, 40).map((r) => (
              <li
                key={r.productId}
                className={cn('rounded-lg border border-border/80 px-3 py-2 text-sm')}
              >
                <span className="font-medium">{r.productName}</span>
                <p className="text-xs text-muted-foreground">{r.note}</p>
              </li>
            ))}
          </ul>
          {cold.length > 40 ? (
            <p className="mt-2 text-xs text-muted-foreground">Showing first 40 of {cold.length}.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
