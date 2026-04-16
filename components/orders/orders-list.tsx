'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatMoneyAmount } from '@/lib/format-money';
import {
  OrderFilters,
  type OrdersFilterState,
  type DatePreset,
} from '@/components/orders/order-filters';
import { OrderSummaryCards, type OrdersSummary } from '@/components/orders/order-summary-cards';

type OrderListRow = {
  id: string;
  customerName: string;
  total: string;
  tax: string;
  discount: string;
  status: string;
  createdAt: string;
  itemsCount: number;
  payment: null;
};

type OrdersResponse = {
  orders: OrderListRow[];
  summary: {
    totalOrders: number;
    totalRevenue: string;
    pendingOrders: number;
    completedOrders: number;
  };
};

export function OrdersList() {
  const todayYmd = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [filters, setFilters] = useState<OrdersFilterState>({
    search: '',
    status: '',
    payment: '',
    preset: 'today',
    fromDate: todayYmd,
    toDate: todayYmd,
  });
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [summary, setSummary] = useState<OrdersSummary>({
    totalOrders: 0,
    totalRevenue: '0.00',
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const resolveDateRange = useCallback((preset: DatePreset, fromDate: string, toDate: string) => {
    if (preset === 'custom') return { fromDate, toDate };
    if (preset === '7d') {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      const from = `${y}-${m}-${d}`;
      return { fromDate: from, toDate: todayYmd };
    }
    return { fromDate: todayYmd, toDate: todayYmd };
  }, [todayYmd]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const range = resolveDateRange(filters.preset, filters.fromDate, filters.toDate);
      const listQs = new URLSearchParams({
        fromDate: range.fromDate,
        toDate: range.toDate,
      });
      if (filters.search.trim()) listQs.set('search', filters.search.trim());
      if (filters.status) listQs.set('status', filters.status);
      if (filters.payment) listQs.set('payment', filters.payment);

      const listRes = await fetch(`/api/orders?${listQs.toString()}`, { cache: 'no-store' });
      const listJson = (await listRes.json().catch(() => null)) as
        | OrdersResponse
        | { error?: string }
        | null;

      if (!listRes.ok) {
        const msg =
          (listJson && !('orders' in listJson) && listJson.error) ||
          `Request failed (${listRes.status})`;
        setFetchError(msg);
        setOrders([]);
        setSummary({
          totalOrders: 0,
          totalRevenue: '0.00',
          pendingOrders: 0,
          completedOrders: 0,
        });
        toast.error(msg);
        return;
      }

      const payload = listJson && 'orders' in listJson ? listJson : null;
      const listedOrders = payload?.orders ?? [];
      const payloadSummary = payload?.summary;

      setSummary({
        totalOrders: payloadSummary?.totalOrders ?? 0,
        totalRevenue: payloadSummary?.totalRevenue ?? '0.00',
        pendingOrders: payloadSummary?.pendingOrders ?? 0,
        completedOrders: payloadSummary?.completedOrders ?? 0,
      });
      setOrders(listedOrders);
    } catch {
      setFetchError('Network error');
      setOrders([]);
      setSummary({
        totalOrders: 0,
        totalRevenue: '0.00',
        pendingOrders: 0,
        completedOrders: 0,
      });
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters, resolveDateRange]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="space-y-4">
        <OrderSummaryCards summary={summary} />
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading orders…
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <OrderSummaryCards summary={summary} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-primary underline"
            onClick={() => void loadOrders()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderSummaryCards summary={summary} />
      <OrderFilters value={filters} onChange={setFilters} onApply={() => void loadOrders()} disabled={loading} />
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-primary underline"
          onClick={() => void loadOrders()}
        >
          Refresh
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No orders found for current filters.</p>
          <p className="mt-1 text-xs text-muted-foreground">Try changing status, date, or payment filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#222] bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#222] bg-[#161616]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Items
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#222] text-white transition-colors hover:bg-[#1a1a1a] last:border-0">
                    <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                      {o.id}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 tabular-nums">{o.itemsCount}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoneyAmount(o.total)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.payment ?? 'Not recorded'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{o.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
