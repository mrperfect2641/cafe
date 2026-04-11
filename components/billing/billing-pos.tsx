'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, QrCode, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { PosCategoryTabs } from '@/components/billing/pos-category-tabs';
import { PosProductCard } from '@/components/billing/pos-product-card';
import { CartItem } from '@/components/billing/cart-item';
import { BillingSummary } from '@/components/billing/billing-summary';
import { QrModal } from '@/components/billing/qr-modal';
import { PrintBill } from '@/components/billing/print-bill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBillingTotals, useBillingCartStore } from '@/store/billing-cart-store';
import type { CategoryDTO, ProductDTO } from '@/types/menu';

type BillingPosProps = {
  cashierName: string;
};

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl bg-white/[0.06]"
          style={{ animationDelay: `${(i % 5) * 40}ms` }}
        />
      ))}
    </div>
  );
}

export function BillingPos({ cashierName }: BillingPosProps) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [tableNo, setTableNo] = useState('');

  const [qrOpen, setQrOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const {
    items,
    gstPercent,
    discount,
    addProduct,
    increment,
    decrement,
    remove,
    clear,
    setGstPercent,
    setDiscount,
  } = useBillingCartStore(
    useShallow((s) => ({
      items: s.items,
      gstPercent: s.gstPercent,
      discount: s.discount,
      addProduct: s.addProduct,
      increment: s.increment,
      decrement: s.decrement,
      remove: s.remove,
      clear: s.clear,
      setGstPercent: s.setGstPercent,
      setDiscount: s.setDiscount,
    })),
  );

  const { subtotal, gstAmount, total } = useMemo(
    () => getBillingTotals({ items, gstPercent, discount }),
    [items, gstPercent, discount],
  );

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        setCategoriesError('Could not load categories');
        setCategories([]);
        return;
      }
      const data = (await res.json()) as CategoryDTO[];
      setCategories(data);
      setSelectedCategoryId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch {
      setCategoriesError('Network error');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (categoryId: string) => {
    setProductsLoading(true);
    try {
      const res = await fetch(`/api/products?categoryId=${encodeURIComponent(categoryId)}`);
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const data = (await res.json()) as ProductDTO[];
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      return;
    }
    void loadProducts(selectedCategoryId);
  }, [selectedCategoryId, loadProducts]);

  const handleAddProduct = useCallback(
    (p: ProductDTO) => {
      addProduct({
        productId: p.id,
        name: p.name,
        price: Number.parseFloat(p.price),
      });
    },
    [addProduct],
  );

  const buildPrintPayload = useCallback(() => {
    return {
      customerName: customerName.trim() || 'Walk-in',
      tableNo: tableNo.trim(),
      lines: items,
      subtotal,
      gstPercent,
      gstAmount,
      discount,
      total,
      issuedAt: new Date(),
    };
  }, [customerName, tableNo, items, subtotal, gstPercent, gstAmount, discount, total]);

  const handleCompleteOrder = useCallback(async () => {
    if (items.length === 0) return;
    setCompleting(true);
    try {
      const name =
        `${customerName.trim() || 'Walk-in'}${tableNo.trim() ? ` · Table ${tableNo.trim()}` : ''}`.slice(
          0,
          200,
        );

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
          tax: gstAmount,
          discount,
          total,
        }),
      });

      const json = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Order failed');
        return;
      }
      toast.success('Order saved');
      clear();
      setCustomerName('');
      setTableNo('');
    } catch {
      toast.error('Order failed');
    } finally {
      setCompleting(false);
    }
  }, [items, customerName, tableNo, gstAmount, discount, total, clear]);

  const cartEmpty = items.length === 0;
  const actionsDisabled = cartEmpty || completing;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col gap-0 lg:flex-row lg:items-stretch">
      {/* LEFT — menu */}
      <motion.div
        layout
        className="min-h-0 flex-1 space-y-4 px-1 pb-6 pt-2 lg:px-2 lg:pr-4"
        initial={false}
      >
        <div className="flex flex-col gap-1 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Billing</h1>
            <p className="text-sm text-zinc-400">POS · {cashierName}</p>
          </div>
        </div>

        {categoriesLoading ? (
          <div className="flex gap-2 overflow-hidden py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 shrink-0 animate-pulse rounded-lg bg-white/10" />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {categoriesError}{' '}
            <button type="button" className="underline" onClick={() => void loadCategories()}>
              Retry
            </button>
          </div>
        ) : (
          <PosCategoryTabs
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            disabled={completing}
          />
        )}

        <div className="min-h-[200px]">
          {productsLoading ? (
            <ProductGridSkeleton />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              <AnimatePresence mode="popLayout">
                {products.map((p) => (
                  <PosProductCard
                    key={p.id}
                    product={p}
                    onAdd={handleAddProduct}
                    disabled={completing}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          {!productsLoading && selectedCategoryId && products.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">No products in this category.</p>
          ) : null}
        </div>
      </motion.div>

      {/* RIGHT — cart (sticky on large screens) */}
      <aside className="flex w-full shrink-0 flex-col border-t border-white/10 bg-[#121212] lg:sticky lg:top-0 lg:max-h-[calc(100dvh-3.5rem)] lg:w-[400px] lg:border-l lg:border-t-0 lg:self-start lg:overflow-y-auto">
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShoppingBag className="h-5 w-5 text-[#ff9800]" />
            Cart
          </h2>

          <div className="space-y-2">
            <Label htmlFor="cust-name" className="text-zinc-400">
              Customer name
            </Label>
            <Input
              id="cust-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional"
              disabled={completing}
              className="border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-no" className="text-zinc-400">
              Table no.
            </Label>
            <Input
              id="table-no"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              placeholder="Optional"
              disabled={completing}
              className="border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="min-h-[120px] flex-1 space-y-2">
            {cartEmpty ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 py-12 text-center transition-colors">
                <ShoppingBag className="mb-2 h-10 w-10 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-400">No items selected</p>
                <p className="mt-1 text-xs text-zinc-600">Tap a product to add it</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((line) => (
                  <CartItem
                    key={line.productId}
                    line={line}
                    onIncrement={increment}
                    onDecrement={decrement}
                    onRemove={remove}
                    disabled={completing}
                  />
                ))}
              </div>
            )}
          </div>

          <BillingSummary
            subtotal={subtotal}
            gstPercent={gstPercent}
            gstAmount={gstAmount}
            discount={discount}
            total={total}
            onGstPercentChange={setGstPercent}
            onDiscountChange={setDiscount}
            disabled={completing}
          />

          <div className="space-y-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              disabled={actionsDisabled}
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="h-4 w-4" />
              Generate QR
            </Button>
            <PrintBill buildPayload={buildPrintPayload} disabled={actionsDisabled} />
            <Button
              type="button"
              className="w-full gap-2 bg-[#ff9800] font-semibold text-black hover:bg-[#ff5722]"
              disabled={actionsDisabled}
              onClick={() => void handleCompleteOrder()}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completing ? 'Saving…' : 'Complete order'}
            </Button>
          </div>
        </div>
      </aside>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        amount={total}
        note={`Cafe bill ${new Date().toISOString().slice(0, 10)}`}
      />
    </div>
  );
}
