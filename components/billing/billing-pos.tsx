'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CreditCard, QrCode, ShoppingBag, Wallet } from 'lucide-react';
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
import { useSettings } from '@/hooks/useSettings';
import type { CategoryDTO, ProductDTO } from '@/types/menu';

type BillingPosProps = {
  cashierName: string;
};

type PaymentMethod = 'cash' | 'upi' | 'card';

type OrdersResponse = {
  orders: Array<{
    id: string;
    customerName: string;
    total: string;
    status: string;
    createdAt: string;
  }>;
};

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

  const [productSearch, setProductSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tableNo, setTableNo] = useState('');

  const [qrOpen, setQrOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrdersResponse['orders']>([]);

  const {
    items,
    gstPercent,
    serviceChargePercent,
    discount,
    addProduct,
    increment,
    decrement,
    remove,
    clear,
    setGstPercent,
    setServiceChargePercent,
    setDiscount,
  } = useBillingCartStore(
    useShallow((s) => ({
      items: s.items,
      gstPercent: s.gstPercent,
      serviceChargePercent: s.serviceChargePercent,
      discount: s.discount,
      addProduct: s.addProduct,
      increment: s.increment,
      decrement: s.decrement,
      remove: s.remove,
      clear: s.clear,
      setGstPercent: s.setGstPercent,
      setServiceChargePercent: s.setServiceChargePercent,
      setDiscount: s.setDiscount,
    })),
  );

  const { settings } = useSettings();
  const discountsEnabled = settings.enable_discounts;
  const todayYmd = useMemo(() => toLocalYmd(new Date()), []);

  useEffect(() => {
    setGstPercent(settings.tax_percentage);
    setServiceChargePercent(settings.service_charge);
    if (!settings.enable_discounts) {
      setDiscount(0);
    }
  }, [
    settings.tax_percentage,
    settings.service_charge,
    settings.enable_discounts,
    setGstPercent,
    setServiceChargePercent,
    setDiscount,
  ]);

  const { subtotal, gstAmount, serviceChargeAmount, taxAmount, total } = useMemo(
    () => getBillingTotals({ items, gstPercent, serviceChargePercent, discount }),
    [items, gstPercent, serviceChargePercent, discount],
  );

  useEffect(() => {
    if (!discountsEnabled) {
      setDiscountMode('amount');
      setDiscountPercent(0);
      return;
    }
    if (discountMode !== 'percent') return;
    const pct = Number.isFinite(discountPercent) ? Math.max(0, Math.min(100, discountPercent)) : 0;
    const computed = Math.round((subtotal * (pct / 100)) * 100) / 100;
    setDiscount(computed);
  }, [discountMode, discountPercent, subtotal, discountsEnabled, setDiscount]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const loadRecentOrders = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ fromDate: todayYmd, toDate: todayYmd });
      const res = await fetch(`/api/orders?${qs.toString()}`, { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as OrdersResponse | { error?: string } | null;
      if (!res.ok || !json || !('orders' in json)) {
        setRecentOrders([]);
        return;
      }
      setRecentOrders((json as OrdersResponse).orders.slice(0, 5));
    } catch {
      setRecentOrders([]);
    }
  }, [todayYmd]);

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

  useEffect(() => {
    void loadRecentOrders();
  }, [loadRecentOrders]);

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
      gstAmount: taxAmount,
      discount,
      total,
      issuedAt: new Date(),
    }; // keep payload shape stable; gstAmount now includes service charge.
  }, [customerName, tableNo, items, subtotal, gstPercent, taxAmount, discount, total]);

  const handleCompleteOrder = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!paymentMethod) {
      toast.error('Select a payment method');
      return;
    }
    setCompleting(true);
    try {
      const baseName = customerName.trim() || 'Walk-in';
      const tablePart = tableNo.trim() ? ` · Table ${tableNo.trim()}` : '';
      const payPart = paymentMethod ? ` · Pay ${paymentMethod.toUpperCase()}` : '';
      const name = `${baseName}${tablePart}${payPart}`.slice(0, 200);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          tableNo: tableNo.trim() || undefined,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
          tax: taxAmount,
          discount: discountsEnabled ? discount : 0,
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
      setPaymentMethod(null);
      void loadRecentOrders();
    } catch {
      toast.error('Order failed');
    } finally {
      setCompleting(false);
    }
  }, [items, paymentMethod, customerName, tableNo, taxAmount, discountsEnabled, discount, total, clear, loadRecentOrders]);

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
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products…"
              disabled={productsLoading || completing}
              className="border-white/15 bg-white/5 text-white placeholder:text-zinc-500 sm:max-w-sm"
            />
            <div className="text-xs text-zinc-400">
              Showing <span className="font-semibold text-white">{filteredProducts.length}</span>
            </div>
          </div>
          {productsLoading ? (
            <ProductGridSkeleton />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p) => (
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
          {!productsLoading && selectedCategoryId && filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              {productSearch.trim() ? 'No matching products.' : 'No products in this category.'}
            </p>
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
            serviceChargePercent={serviceChargePercent}
            serviceChargeAmount={serviceChargeAmount}
            discount={discount}
            discountMode={discountMode}
            discountPercent={discountPercent}
            total={total}
            onGstPercentChange={setGstPercent}
            onServiceChargePercentChange={setServiceChargePercent}
            onDiscountChange={setDiscount}
            onDiscountModeChange={(mode) => {
              setDiscountMode(mode);
              if (mode === 'amount') setDiscountPercent(0);
            }}
            onDiscountPercentChange={setDiscountPercent}
            discountsEnabled={discountsEnabled}
            disabled={completing}
          />

          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white">Payment</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                disabled={completing}
                className={
                  paymentMethod === 'cash'
                    ? 'flex items-center justify-center gap-2 rounded-lg border border-[#ff9800]/60 bg-[#ff9800]/15 px-3 py-2 text-sm font-semibold text-white'
                    : 'flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10'
                }
              >
                <Wallet className="h-4 w-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                disabled={completing}
                className={
                  paymentMethod === 'upi'
                    ? 'flex items-center justify-center gap-2 rounded-lg border border-[#ff9800]/60 bg-[#ff9800]/15 px-3 py-2 text-sm font-semibold text-white'
                    : 'flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10'
                }
              >
                <QrCode className="h-4 w-4" />
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                disabled={completing}
                className={
                  paymentMethod === 'card'
                    ? 'flex items-center justify-center gap-2 rounded-lg border border-[#ff9800]/60 bg-[#ff9800]/15 px-3 py-2 text-sm font-semibold text-white'
                    : 'flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10'
                }
              >
                <CreditCard className="h-4 w-4" />
                Card
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Payment method is used for POS workflow (storage will be wired when backend supports it).
            </p>
          </div>

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

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Recent orders</p>
              <button
                type="button"
                onClick={() => void loadRecentOrders()}
                disabled={completing}
                className="text-xs font-medium text-[#ff9800] hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent orders today.</p>
              ) : (
                recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-zinc-500">{o.id}</p>
                      <p className="truncate text-sm font-medium text-white">{o.customerName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">{o.status}</p>
                      <p className="text-xs text-zinc-500">
                        {Math.max(0, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000))}m ago
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Print template (used by PrintBill) */}
          <div id="print-area" className="hidden">
            <h1>Smart Cafe</h1>
            <div className="muted">
              <div>{new Date().toLocaleString()}</div>
              <div>Cashier: {cashierName}</div>
              <div>Customer: {customerName.trim() || 'Walk-in'}</div>
              {tableNo.trim() ? <div>Table: {tableNo.trim()}</div> : null}
              {paymentMethod ? <div>Payment: {paymentMethod.toUpperCase()}</div> : null}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Qty</th>
                  <th className="num">Price</th>
                  <th className="num">Line</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.productId}>
                    <td>{l.name}</td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{l.price.toFixed(2)}</td>
                    <td className="num">{(l.price * l.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="summary">
              <div>
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span>GST ({gstPercent}%)</span>
                <span>{gstAmount.toFixed(2)}</span>
              </div>
              <div>
                <span>Service ({serviceChargePercent}%)</span>
                <span>{serviceChargeAmount.toFixed(2)}</span>
              </div>
              <div>
                <span>Discount</span>
                <span>{(discountsEnabled ? discount : 0).toFixed(2)}</span>
              </div>
              <div className="total">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
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
