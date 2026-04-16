'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PackageSearch,
  PlusCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserPublic } from '@/types/user';

type ManagerDashboardPayload = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Array<{
    id: string;
    customerName: string;
    total: string;
    status: string;
    createdAt: string;
  }>;
  staffPerformance: Array<{
    userId: string;
    staffName: string;
    ordersHandled: number;
  }>;
  menuStatus: {
    totalItems: number;
    outOfStockItems: number;
  };
};

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardPayload | null>(null);
  const [staffUsers, setStaffUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        fetch('/api/manager/dashboard', { cache: 'no-store' }),
        fetch('/api/users', { cache: 'no-store' }),
      ]);

      const dashboardJson = (await dashboardRes.json().catch(() => null)) as
        | ManagerDashboardPayload
        | { error?: string }
        | null;
      const usersJson = (await usersRes.json().catch(() => null)) as UserPublic[] | { error?: string } | null;

      if (!dashboardRes.ok || !usersRes.ok) {
        const msg =
          (!dashboardRes.ok &&
            dashboardJson &&
            'error' in dashboardJson &&
            typeof dashboardJson.error === 'string' &&
            dashboardJson.error) ||
          (!usersRes.ok &&
            usersJson &&
            !Array.isArray(usersJson) &&
            typeof usersJson.error === 'string' &&
            usersJson.error) ||
          'Failed to load manager dashboard';
        setError(msg);
        return;
      }

      setData(dashboardJson as ManagerDashboardPayload);
      setStaffUsers(Array.isArray(usersJson) ? usersJson : []);
    } catch {
      setError('Network error while loading dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeStaffCount = useMemo(() => staffUsers.filter((u) => u.isActive).length, [staffUsers]);

  const staffActivity = useMemo(() => {
    if (!data) return [];
    const orderMap = new Map(data.staffPerformance.map((s) => [s.userId, s.ordersHandled] as const));
    return staffUsers.map((staff) => {
      const ordersHandled = orderMap.get(staff.id) ?? 0;
      return {
        id: staff.id,
        name: staff.name,
        ordersHandled,
        activity: ordersHandled > 0 ? 'Active' : 'Idle',
      };
    });
  }, [data, staffUsers]);

  const alerts = useMemo(() => {
    if (!data) return [];
    const next: Array<{ key: string; label: string }> = [];
    if (data.pendingOrders >= 5) next.push({ key: 'pending', label: 'High pending orders. Review queue.' });
    if (data.recentOrders.length === 0) next.push({ key: 'recent', label: 'No recent orders found.' });
    if (data.menuStatus.outOfStockItems > 0) {
      next.push({
        key: 'stock',
        label: `${data.menuStatus.outOfStockItems} menu item(s) are out of stock.`,
      });
    }
    return next;
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error ?? 'Failed to load manager dashboard.'}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Orders today</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending orders</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active staff</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{activeStaffCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Out of stock items</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.menuStatus.outOfStockItems}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold tracking-tight">Recent orders</h3>
          <div className="mt-4 space-y-2">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            ) : (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    <p className="text-sm font-medium">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight">Alerts</h3>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-emerald-500">All operations look healthy.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.key} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <p className="text-sm text-amber-200">{alert.label}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight">Staff activity</h3>
          <div className="mt-4 space-y-2">
            {staffActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff activity data yet.</p>
            ) : (
              staffActivity.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.ordersHandled} orders handled today</p>
                  </div>
                  <span
                    className={
                      staff.activity === 'Active'
                        ? 'inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-500'
                        : 'inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                    }
                  >
                    {staff.activity}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight">Menu status</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total items</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{data.menuStatus.totalItems}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Out of stock</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{data.menuStatus.outOfStockItems}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" className="gap-1.5">
            <Link href="/menu">
              <PlusCircle className="h-4 w-4" />
              Add product
            </Link>
          </Button>
          <Button asChild type="button" size="sm" variant="outline" className="gap-1.5 transition-transform hover:-translate-y-0.5">
            <Link href="/users">
              <Users className="h-4 w-4" />
              Manage staff
            </Link>
          </Button>
          <Button asChild type="button" size="sm" variant="outline" className="gap-1.5 transition-transform hover:-translate-y-0.5">
            <Link href="/orders">
              <ClipboardList className="h-4 w-4" />
              View orders
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
