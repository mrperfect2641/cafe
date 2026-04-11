'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReportCards } from '@/components/reports/report-cards';
import { TopProducts } from '@/components/reports/top-products';
import { StaffPerformance } from '@/components/reports/staff-performance';
import { PaymentBreakdown } from '@/components/reports/payment-breakdown';
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

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localStartOf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function localEndOf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const y = toYmd(now);
  return { from: y, to: y };
}

function lastNDaysInclusive(n: number): { from: string; to: string } {
  const now = new Date();
  const start = localStartOf(addDays(now, -(n - 1)));
  return { from: toYmd(start), to: toYmd(now) };
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
      const json = (await res.json().catch(() => null)) as AnalyticsPayload | { error?: string } | null;
      if (!res.ok) {
        const msg =
          json && 'error' in json && typeof json.error === 'string' ? json.error : `Error ${res.status}`;
        setError(msg);
        setData(null);
        toast.error(msg);
        return;
      }
      if (!json || typeof (json as AnalyticsPayload).revenue !== 'string') {
        setError('Invalid response');
        setData(null);
        return;
      }
      setData(json as AnalyticsPayload);
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
    <div className="space-y-8">
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
          <ReportCards
            revenue={data.revenue}
            totalOrders={data.totalOrders}
            avgOrderValue={data.avgOrderValue}
          />

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">Sales over time</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Daily revenue in selected range</p>
            <div className="mt-4 min-w-0">
              <SalesChart data={chartData} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-semibold tracking-tight">Top products</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">By quantity sold</p>
              <div className="mt-4">
                <TopProducts products={data.topProducts} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-semibold tracking-tight">Staff performance</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">By checkout attribution</p>
              <div className="mt-4">
                <StaffPerformance rows={data.staffPerformance} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
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
