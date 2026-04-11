'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { AnalyticsPaymentRow } from '@/types/analytics';

function labelForMethod(key: string): string {
  if (key === 'NOT_RECORDED') return 'Not recorded';
  return key;
}

type PaymentBreakdownProps = {
  rows: AnalyticsPaymentRow[];
};

export function PaymentBreakdown({ rows }: PaymentBreakdownProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No payment data.</p>
    );
  }

  return (
    <ul className="divide-y divide-border text-sm">
      {rows.map((r) => (
        <li key={r.paymentMethod} className="flex items-center justify-between gap-4 py-3 first:pt-0">
          <div>
            <p className="font-medium">{labelForMethod(r.paymentMethod)}</p>
            <p className="text-xs text-muted-foreground">{r.orderCount} orders</p>
          </div>
          <p className="shrink-0 tabular-nums font-medium">{formatMoneyAmount(r.total)}</p>
        </li>
      ))}
    </ul>
  );
}
