'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { AovInsights } from '@/types/analytics';
import { ShoppingCart } from 'lucide-react';

export function AovInsightsCard({ aov }: Readonly<{ aov: AovInsights }>) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Average order value (AOV)</h3>
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span>
              <span className="text-muted-foreground">AOV </span>
              <span className="text-lg font-semibold tabular-nums">{formatMoneyAmount(aov.avgOrderValue)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Units per order </span>
              <span className="text-lg font-semibold tabular-nums">{aov.avgUnitsPerOrder}</span>
            </span>
          </p>
          <p className="mt-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            {aov.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}
