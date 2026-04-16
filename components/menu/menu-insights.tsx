import { prisma } from '@/lib/prisma';
import { MenuInsightsClient } from '@/components/menu/menu-insights-client';

const TOP_LIMIT = 5;

type ProductMetrics = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

function buildProductMetrics(
  rows: Array<{
    productId: string;
    quantity: number;
    price: { toString(): string };
    product: { name: string };
  }>,
): ProductMetrics[] {
  const map = new Map<string, ProductMetrics>();

  for (const row of rows) {
    const existing = map.get(row.productId) ?? {
      productId: row.productId,
      productName: row.product.name,
      quantitySold: 0,
      revenue: 0,
    };
    existing.quantitySold += row.quantity;
    existing.revenue += Number(row.price.toString()) * row.quantity;
    map.set(row.productId, existing);
  }

  return [...map.values()];
}

export async function MenuInsights() {
  const [products, orderItems] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, price: true, isAvailable: true },
      orderBy: { name: 'asc' },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { not: 'CANCELLED' } } },
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const metrics = buildProductMetrics(orderItems);
  const metricsByProductId = new Map(metrics.map((m) => [m.productId, m] as const));
  const topSelling = [...metrics].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, TOP_LIMIT);
  const mostProfitable = [...metrics].sort((a, b) => b.revenue - a.revenue).slice(0, TOP_LIMIT);
  const lowPerforming = [...metrics].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, TOP_LIMIT);
  const lowPerformingProductCount = products.filter((p) => (metricsByProductId.get(p.id)?.quantitySold ?? 0) <= 2).length;

  return (
    <MenuInsightsClient
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        isAvailable: product.isAvailable,
      }))}
      topSelling={topSelling}
      mostProfitable={mostProfitable}
      lowPerforming={lowPerforming}
      lowPerformingProductCount={lowPerformingProductCount}
    />
  );
}
