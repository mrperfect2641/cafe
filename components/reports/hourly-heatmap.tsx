'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SalesByHourRow } from '@/types/analytics';
import { formatMoneyAmount } from '@/lib/format-money';

export function HourlyHeatmap({ rows }: Readonly<{ rows: SalesByHourRow[] }>) {
  const data = useMemo(
    () =>
      rows.map((r) => ({
        label: `${r.hour}:00`,
        hour: r.hour,
        revenue: Number(r.revenue),
        orders: r.orderCount,
      })),
    [rows],
  );

  const maxR = useMemo(() => Math.max(1, ...data.map((d) => d.revenue)), [data]);
  const peak = useMemo(() => data.reduce((a, b) => (b.revenue > a.revenue ? b : a), data[0]!), [data]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {Number(peak.revenue) > 0 ? (
          <>
            Peak activity around <span className="font-medium text-foreground">{peak.label}</span> in this
            range.
          </>
        ) : (
          'No hourly sales in the selected range.'
        )}
      </p>
      <div className="h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={2}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as { revenue: number; orders: number; label: string };
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{p.label}</p>
                    <p className="tabular-nums text-muted-foreground">{formatMoneyAmount(p.revenue)}</p>
                    <p className="text-muted-foreground">{p.orders} orders</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))">
              {data.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill="hsl(var(--primary))"
                  fillOpacity={maxR > 0 ? 0.35 + (entry.revenue / maxR) * 0.65 : 0.35}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
