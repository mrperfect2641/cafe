'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { formatMoneyAmount } from '@/lib/format-money';
import { useProductModalStore } from '@/store/product-modal-store';

type IngredientRow = {
  name: string;
  quantity: number;
  unit: string;
};

type ProductDetails = {
  id: string;
  name: string;
  price: string;
  category: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  totalSold: number;
  totalRevenue: string;
  lastOrderedAt: string | null;
  ingredients: IngredientRow[];
  cost: string;
  profit: string;
};

function formatINR(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

export function ProductDetailsModal() {
  const { isOpen, productId, closeProductModal } = useProductModalStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductDetails | null>(null);

  useEffect(() => {
    if (!isOpen || !productId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}/details`, {
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => null)) as ProductDetails | { error?: string } | null;
        if (!res.ok) {
          if (!cancelled) setError((json as { error?: string } | null)?.error ?? 'Failed to load product');
          return;
        }
        if (!cancelled) setData(json as ProductDetails);
      } catch {
        if (!cancelled) setError('Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);

  if (!isOpen || !productId) {
    return null;
  }

  return (
    <Modal open onClose={closeProductModal} title="Product details" size="lg">
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="h-16 animate-pulse rounded border border-border bg-muted/40" />
            <div className="h-16 animate-pulse rounded border border-border bg-muted/40" />
            <div className="h-16 animate-pulse rounded border border-border bg-muted/40" />
            <div className="h-16 animate-pulse rounded border border-border bg-muted/40" />
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No product details available.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{data.name}</h3>
              <p className="text-sm text-muted-foreground">
                {data.category} • {formatINR(data.price)}
              </p>
            </div>
            <span
              className={
                data.status === 'AVAILABLE'
                  ? 'rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600'
                  : 'rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'
              }
            >
              {data.status}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total sold</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{data.totalSold}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatINR(data.totalRevenue)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last ordered</p>
              <p className="mt-1 text-sm font-medium">{data.lastOrderedAt ? new Date(data.lastOrderedAt).toLocaleString() : 'Never'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">Ingredients</p>
            {data.ingredients.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">No ingredient data configured.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {data.ingredients.map((ingredient) => (
                  <li key={`${ingredient.name}-${ingredient.unit}`}>
                    {ingredient.name}: {ingredient.quantity} {ingredient.unit}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cost</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoneyAmount(data.cost)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profit</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoneyAmount(data.profit)}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
