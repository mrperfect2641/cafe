'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DashboardCards } from '@/components/dashboard/dashboard-cards';
import type { AnalyticsPayload } from '@/types/analytics';
import { Button } from '@/components/ui/button';

const SalesChart = dynamic(() => import('@/components/dashboard/sales-chart'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
  ),
});

type OrderListRow = {
  orders: Array<{ id: string }>;
  summary: {
    pendingOrders: number;
  };
};

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lastNDaysInclusive(n: number): { fromDate: string; toDate: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (n - 1));
  return { fromDate: toYmd(start), toDate: toYmd(now) };
}

export function DashboardOverview() {
  const today = useMemo(() => toYmd(new Date()), []);
  const [todayKpis, setTodayKpis] = useState<AnalyticsPayload | null>(null);
  const [salesTrend, setSalesTrend] = useState<AnalyticsPayload | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trendRange = lastNDaysInclusive(7);
      const [todayAnalyticsRes, trendAnalyticsRes, pendingRes] = await Promise.all([
        fetch(`/api/analytics?fromDate=${today}&toDate=${today}`, { cache: 'no-store' }),
        fetch(
          `/api/analytics?fromDate=${trendRange.fromDate}&toDate=${trendRange.toDate}`,
          { cache: 'no-store' },
        ),
        fetch(`/api/orders?fromDate=${today}&toDate=${today}&status=CREATED`, { cache: 'no-store' }),
      ]);

      const todayJson = (await todayAnalyticsRes.json().catch(() => null)) as
        | AnalyticsPayload
        | { error?: string }
        | null;
      const trendJson = (await trendAnalyticsRes.json().catch(() => null)) as
        | AnalyticsPayload
        | { error?: string }
        | null;
      const pendingJson = (await pendingRes.json().catch(() => null)) as
        | OrderListRow
        | { error?: string }
        | null;

      if (!todayAnalyticsRes.ok || !trendAnalyticsRes.ok || !pendingRes.ok) {
        const msg =
          (!todayAnalyticsRes.ok &&
            todayJson &&
            'error' in todayJson &&
            typeof todayJson.error === 'string' &&
            todayJson.error) ||
          (!trendAnalyticsRes.ok &&
            trendJson &&
            'error' in trendJson &&
            typeof trendJson.error === 'string' &&
            trendJson.error) ||
          (!pendingRes.ok &&
            pendingJson &&
            !('orders' in pendingJson) &&
            typeof pendingJson.error === 'string' &&
            pendingJson.error) ||
          'Failed to load dashboard data';
        setError(msg);
        toast.error(msg);
        return;
      }

      setTodayKpis(todayJson as AnalyticsPayload);
      setSalesTrend(trendJson as AnalyticsPayload);
      setPendingOrders(pendingJson && 'summary' in pendingJson ? pendingJson.summary.pendingOrders : 0);
    } catch {
      setError('Network error while loading dashboard');
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
        <div className="h-[320px] animate-pulse rounded-xl border border-border bg-muted/40" />
      </div>
    );
  }

  if (error || !todayKpis || !salesTrend) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">{error ?? 'Failed to load dashboard data.'}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardCards
        revenueToday={todayKpis.revenue}
        ordersToday={todayKpis.totalOrders}
        avgOrderValue={todayKpis.avgOrderValue}
        pendingOrders={pendingOrders}
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Sales trend</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Revenue over the last 7 days</p>
        <div className="mt-4 min-w-0">
          <SalesChart data={salesTrend.salesByDate} />
        </div>
      </section>
    </div>
  );
}
