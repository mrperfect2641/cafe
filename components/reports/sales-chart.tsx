'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsSalesByDateRow } from '@/types/analytics';
import { formatMoneyAmount } from '@/lib/format-money';

type SalesChartProps = {
  data: AnalyticsSalesByDateRow[];
};

function SalesChart({ data }: SalesChartProps) {
  const chartData = useMemo(
    () =>
      data.map((row) => ({
        date: row.date,
        revenue: Number.parseFloat(row.revenue),
        orderCount: row.orderCount,
      })),
    [data],
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        No sales in this date range.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickFormatter={(v) => formatMoneyAmount(v)}
            width={72}
          />
          <Tooltip
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value);
              const safe = Number.isFinite(n) ? n : 0;
              return [
                name === 'revenue' ? formatMoneyAmount(safe) : safe,
                name === 'revenue' ? 'Revenue' : String(name),
              ];
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SalesChart;
