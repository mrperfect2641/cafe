'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type DatePreset = 'today' | '7d' | 'custom';

export type OrdersFilterState = {
  search: string;
  status: '' | 'CREATED' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  payment: '' | 'NOT_RECORDED' | 'cash' | 'upi' | 'card';
  preset: DatePreset;
  fromDate: string;
  toDate: string;
};

type OrderFiltersProps = {
  value: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
  onApply: () => void;
  disabled?: boolean;
};

export function OrderFilters({ value, onChange, onApply, disabled = false }: Readonly<OrderFiltersProps>) {
  const set = <K extends keyof OrdersFilterState>(key: K, next: OrdersFilterState[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-1.5 lg:col-span-4">
          <Label htmlFor="orders-search">Search</Label>
          <Input
            id="orders-search"
            placeholder="Order ID or customer"
            value={value.search}
            onChange={(e) => set('search', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="orders-status">Status</Label>
          <select
            id="orders-status"
            value={value.status}
            onChange={(e) => set('status', e.target.value as OrdersFilterState['status'])}
            disabled={disabled}
            className="h-8 w-full rounded-lg border border-[#222] bg-[#111] px-2.5 text-sm text-white"
          >
            <option value="">All</option>
            <option value="CREATED">Created</option>
            <option value="PAID">Paid</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="orders-payment">Payment</Label>
          <select
            id="orders-payment"
            value={value.payment}
            onChange={(e) => set('payment', e.target.value as OrdersFilterState['payment'])}
            disabled={disabled}
            className="h-8 w-full rounded-lg border border-[#222] bg-[#111] px-2.5 text-sm text-white"
          >
            <option value="">All</option>
            <option value="NOT_RECORDED">Not recorded</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="orders-date-preset">Date range</Label>
          <select
            id="orders-date-preset"
            value={value.preset}
            onChange={(e) => set('preset', e.target.value as DatePreset)}
            disabled={disabled}
            className="h-8 w-full rounded-lg border border-[#222] bg-[#111] px-2.5 text-sm text-white"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex items-end lg:col-span-2">
          <Button type="button" className="w-full" onClick={onApply} disabled={disabled}>
            Apply filters
          </Button>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="orders-from">From</Label>
          <Input
            id="orders-from"
            type="date"
            value={value.fromDate}
            onChange={(e) => {
              onChange({ ...value, preset: 'custom', fromDate: e.target.value });
            }}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="orders-to">To</Label>
          <Input
            id="orders-to"
            type="date"
            value={value.toDate}
            onChange={(e) => {
              onChange({ ...value, preset: 'custom', toDate: e.target.value });
            }}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
