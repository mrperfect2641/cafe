'use client';

import { formatMoneyAmount } from '@/lib/format-money';
import type { AnalyticsStaffRow } from '@/types/analytics';

type StaffPerformanceProps = {
  rows: AnalyticsStaffRow[];
};

export function StaffPerformance({ rows }: StaffPerformanceProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No staff-attributed orders.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Staff
            </th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Orders
            </th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.userId ?? `unassigned-${i}`}
              className="border-b border-border last:border-0"
            >
              <td className="px-3 py-2">{r.userName}</td>
              <td className="px-3 py-2 tabular-nums">{r.orderCount}</td>
              <td className="px-3 py-2 tabular-nums">{formatMoneyAmount(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
