'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatMoneyAmount } from '@/lib/format-money';

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

export function OrdersList() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as OrderListRow[] | { error?: string } | null;
      if (!res.ok) {
        const msg =
          json && !Array.isArray(json) && typeof json.error === 'string'
            ? json.error
            : `Request failed (${res.status})`;
        setFetchError(msg);
        setOrders([]);
        toast.error(msg);
        return;
      }
      setOrders(Array.isArray(json) ? json : []);
    } catch {
      setFetchError('Network error');
      setOrders([]);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

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
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading orders…
      </div>
    );
  }

  if (fetchError) {
    return (
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
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No orders yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Confirmed checkouts from Billing appear here.
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-primary underline"
          onClick={() => void loadOrders()}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-primary underline"
          onClick={() => void loadOrders()}
        >
          Refresh
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {o.id}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3 tabular-nums">{o.itemsCount}</td>
                  <td className="px-4 py-3 tabular-nums">{formatMoneyAmount(o.total)}</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
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
    </div>
  );
}
