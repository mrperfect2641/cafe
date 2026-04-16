'use client';

import { useMemo, useState } from 'react';
import { formatMoneyAmount } from '@/lib/format-money';
import { useProductModalStore } from '@/store/product-modal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MenuSummaryCards } from '@/components/menu/menu-summary-cards';

type ProductMetrics = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

type ProductPriceRow = {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
};

type MenuInsightsClientProps = {
  products: ProductPriceRow[];
  topSelling: ProductMetrics[];
  mostProfitable: ProductMetrics[];
  lowPerforming: ProductMetrics[];
  lowPerformingProductCount: number;
};

type InsightFilter = 'ALL' | 'TOP_SELLING' | 'PROFITABLE' | 'LOW_PERFORMING';

export function MenuInsightsClient({
  products,
  topSelling,
  mostProfitable,
  lowPerforming,
  lowPerformingProductCount,
}: Readonly<MenuInsightsClientProps>) {
  const openProductModal = useProductModalStore((s) => s.openProductModal);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('ALL');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (name: string) => name.toLowerCase().includes(normalizedSearch);

  const filteredTopSelling = useMemo(
    () => topSelling.filter((item) => matchesSearch(item.productName)),
    [topSelling, normalizedSearch],
  );
  const filteredMostProfitable = useMemo(
    () => mostProfitable.filter((item) => matchesSearch(item.productName)),
    [mostProfitable, normalizedSearch],
  );
  const filteredLowPerforming = useMemo(
    () => lowPerforming.filter((item) => matchesSearch(item.productName)),
    [lowPerforming, normalizedSearch],
  );
  const filteredProducts = useMemo(
    () => products.filter((product) => matchesSearch(product.name)),
    [products, normalizedSearch],
  );

  const totalMenuValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price), 0),
    [products],
  );
  const topSellingProduct = filteredTopSelling[0]?.productName ?? topSelling[0]?.productName ?? '';

  const showTopSelling = activeFilter === 'ALL' || activeFilter === 'TOP_SELLING';
  const showProfitable = activeFilter === 'ALL' || activeFilter === 'PROFITABLE';
  const showLowPerforming = activeFilter === 'ALL' || activeFilter === 'LOW_PERFORMING';

  return (
    <div className="space-y-6">
      <MenuSummaryCards
        totalProducts={products.length}
        totalMenuValue={totalMenuValue}
        topSellingProduct={topSellingProduct}
        lowPerformingProductCount={lowPerformingProductCount}
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search product name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('ALL')}
            >
              All
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'TOP_SELLING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('TOP_SELLING')}
            >
              Top Selling
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'PROFITABLE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('PROFITABLE')}
            >
              Profitable
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'LOW_PERFORMING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('LOW_PERFORMING')}
            >
              Low Performing
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {showTopSelling ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Top selling products
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Qty sold
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTopSelling.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No matching products in this view.
                    </td>
                  </tr>
                ) : (
                  filteredTopSelling.map((item) => (
                    <tr
                      key={item.productId}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                      onClick={() => openProductModal(item.productId)}
                    >
                      <td className="px-4 py-2 font-medium">{item.productName}</td>
                      <td className="px-4 py-2 tabular-nums">{item.quantitySold}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        {showProfitable ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Most profitable items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMostProfitable.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No matching products in this view.
                    </td>
                  </tr>
                ) : (
                  filteredMostProfitable.map((item) => (
                    <tr
                      key={item.productId}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                      onClick={() => openProductModal(item.productId)}
                    >
                      <td className="px-4 py-2 font-medium">{item.productName}</td>
                      <td className="px-4 py-2 tabular-nums">{formatMoneyAmount(item.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {showLowPerforming ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Low performing items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Qty sold
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLowPerforming.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No matching products in this view.
                    </td>
                  </tr>
                ) : (
                  filteredLowPerforming.map((item) => (
                    <tr
                      key={item.productId}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                      onClick={() => openProductModal(item.productId)}
                    >
                      <td className="px-4 py-2 font-medium">{item.productName}</td>
                      <td className="px-4 py-2 tabular-nums">{item.quantitySold}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Product pricing
            </h2>
          </div>
          <div className="max-h-[340px] overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No matching products.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                      onClick={() => openProductModal(product.id)}
                    >
                      <td className="px-4 py-2 font-medium">{product.name}</td>
                      <td className="px-4 py-2 tabular-nums">{formatMoneyAmount(Number(product.price))}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            product.isAvailable
                              ? 'rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600'
                              : 'rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'
                          }
                        >
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </div>
  );
}
