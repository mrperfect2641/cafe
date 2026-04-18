'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReportCards } from '@/components/reports/report-cards';
import { TopProducts } from '@/components/reports/top-products';
import { StaffPerformance } from '@/components/reports/staff-performance';
import { PaymentBreakdown } from '@/components/reports/payment-breakdown';
import { ProductPerformanceMatrix } from '@/components/reports/product-performance-matrix';
import { GrowthComparisonCard } from '@/components/reports/growth-comparison';
import { AovInsightsCard } from '@/components/reports/aov-insights';
import { SmartInsightsPanel } from '@/components/reports/smart-insights-panel';
import { CategoryPerformance } from '@/components/reports/category-performance';
import { LostRevenuePanel } from '@/components/reports/lost-revenue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AnalyticsPayload } from '@/types/analytics';

const SalesChart = dynamic(() => import('@/components/reports/sales-chart'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
  ),
});

const HourlyHeatmap = dynamic(() => import('@/components/reports/hourly-heatmap').then((m) => m.HourlyHeatmap), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
  ),
});

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const y = toYmd(now);
  return { from: y, to: y };
}

function localStartOf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function lastNDaysInclusive(n: number): { from: string; to: string } {
  const now = new Date();
  const start = localStartOf(addDays(now, -(n - 1)));
  return { from: toYmd(start), to: toYmd(now) };
}

function normalizePayload(raw: unknown): AnalyticsPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const j = raw as Record<string, unknown>;
  if (typeof j.revenue !== 'string') return null;
  return {
    revenue: j.revenue,
    totalOrders: typeof j.totalOrders === 'number' ? j.totalOrders : 0,
    avgOrderValue: typeof j.avgOrderValue === 'string' ? j.avgOrderValue : '0.00',
    salesByDate: Array.isArray(j.salesByDate) ? (j.salesByDate as AnalyticsPayload['salesByDate']) : [],
    topProducts: Array.isArray(j.topProducts) ? (j.topProducts as AnalyticsPayload['topProducts']) : [],
    staffPerformance: Array.isArray(j.staffPerformance)
      ? (j.staffPerformance as AnalyticsPayload['staffPerformance'])
      : [],
    paymentBreakdown: Array.isArray(j.paymentBreakdown)
      ? (j.paymentBreakdown as AnalyticsPayload['paymentBreakdown'])
      : [],
    productMatrix: Array.isArray(j.productMatrix) ? (j.productMatrix as AnalyticsPayload['productMatrix']) : [],
    salesByHour: Array.isArray(j.salesByHour) ? (j.salesByHour as AnalyticsPayload['salesByHour']) : [],
    categoryPerformance: Array.isArray(j.categoryPerformance)
      ? (j.categoryPerformance as AnalyticsPayload['categoryPerformance'])
      : [],
    lostRevenue: Array.isArray(j.lostRevenue) ? (j.lostRevenue as AnalyticsPayload['lostRevenue']) : [],
    growth: (j.growth as AnalyticsPayload['growth']) ?? {
      todayVsYesterday: {
        current: { revenue: '0.00', orders: 0 },
        previous: { revenue: '0.00', orders: 0 },
        revenueChangePct: null,
      },
      rolling7VsPrev7: {
        current: { revenue: '0.00', orders: 0 },
        previous: { revenue: '0.00', orders: 0 },
        revenueChangePct: null,
      },
    },
    aovInsights: (j.aovInsights as AnalyticsPayload['aovInsights']) ?? {
      avgOrderValue: typeof j.avgOrderValue === 'string' ? j.avgOrderValue : '0.00',
      avgUnitsPerOrder: '0',
      suggestion: 'Load analytics to see AOV suggestions.',
    },
    smartInsights: Array.isArray(j.smartInsights) ? (j.smartInsights as AnalyticsPayload['smartInsights']) : [],
  };
}

export function ReportsDashboard() {
  const initial = useMemo(() => todayRange(), []);
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        fromDate,
        toDate,
      });
      const res = await fetch(`/api/analytics?${qs.toString()}`, { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg =
          json && 'error' in json && typeof json.error === 'string' ? json.error : `Error ${res.status}`;
        setError(msg);
        setData(null);
        toast.error(msg);
        return;
      }
      const normalized = normalizePayload(json);
      if (!normalized) {
        setError('Invalid response');
        setData(null);
        return;
      }
      setData(normalized);
    } catch {
      setError('Network error');
      setData(null);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const applyPreset = useCallback((preset: 'today' | '7d' | '30d') => {
    if (preset === 'today') {
      const r = todayRange();
      setFromDate(r.from);
      setToDate(r.to);
      return;
    }
    if (preset === '7d') {
      const r = lastNDaysInclusive(7);
      setFromDate(r.from);
      setToDate(r.to);
      return;
    }
    const r = lastNDaysInclusive(30);
    setFromDate(r.from);
    setToDate(r.to);
  }, []);

  const chartData = useMemo(() => data?.salesByDate ?? [], [data?.salesByDate]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('today')}>
            Today
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('7d')}>
            7 days
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('30d')}>
            30 days
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="reports-from" className="text-xs">
              From
            </Label>
            <Input
              id="reports-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reports-to" className="text-xs">
              To
            </Label>
            <Input
              id="reports-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
          <Button type="button" onClick={() => void fetchAnalytics()} disabled={loading}>
            Apply
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading analytics…
        </div>
      ) : error && !data ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void fetchAnalytics()}>
            Retry
          </Button>
        </div>
      ) : data ? (
        <>
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">Growth intelligence</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Today vs yesterday and rolling 7-day windows (always relative to now, not only the filter above).
            </p>
            <div className="mt-4">
              <GrowthComparisonCard growth={data.growth} />
            </div>
          </section>

          <section>
            <SmartInsightsPanel insights={data.smartInsights} />
          </section>

          <ReportCards
            revenue={data.revenue}
            totalOrders={data.totalOrders}
            avgOrderValue={data.avgOrderValue}
          />

          <AovInsightsCard aov={data.aovInsights} />

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">Product performance matrix</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Classify menu items in the selected date range to support menu decisions.
            </p>
            <div className="mt-4">
              <ProductPerformanceMatrix items={data.productMatrix} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Hourly sales heatmap</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Revenue by hour of day in the selected range</p>
              <div className="mt-4 min-w-0">
                <HourlyHeatmap rows={data.salesByHour} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Sales over time</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Daily revenue in selected range</p>
              <div className="mt-4 min-w-0">
                <SalesChart data={chartData} />
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-semibold tracking-tight">Category performance</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Revenue share by category</p>
              <div className="mt-4">
                <CategoryPerformance rows={data.categoryPerformance} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-semibold tracking-tight">Staff analytics</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Orders and revenue per staff member</p>
              <div className="mt-4">
                <StaffPerformance rows={data.staffPerformance} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-semibold tracking-tight">Lost revenue signals</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Stock-outs and stale menu items</p>
              <div className="mt-4">
                <LostRevenuePanel rows={data.lostRevenue} />
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Top products</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">By quantity sold in range</p>
              <div className="mt-4">
                <TopProducts products={data.topProducts} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Payment breakdown</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">When recorded at checkout</p>
              <div className="mt-4">
                <PaymentBreakdown rows={data.paymentBreakdown} />
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
