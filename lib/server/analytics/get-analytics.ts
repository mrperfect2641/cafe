import type { Prisma } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { formatLocalYmd } from '@/lib/server/analytics/date-range';

export type AnalyticsSalesByDateRow = {
  date: string;
  revenue: string;
  orderCount: number;
};

export type AnalyticsTopProduct = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
};

export type AnalyticsStaffRow = {
  userId: string | null;
  userName: string;
  orderCount: number;
  revenue: string;
};

export type AnalyticsPaymentRow = {
  paymentMethod: string;
  orderCount: number;
  total: string;
};

export type AnalyticsPayload = {
  revenue: string;
  totalOrders: number;
  avgOrderValue: string;
  salesByDate: AnalyticsSalesByDateRow[];
  topProducts: AnalyticsTopProduct[];
  staffPerformance: AnalyticsStaffRow[];
  paymentBreakdown: AnalyticsPaymentRow[];
};

function decimalToMoneyString(v: { toString(): string } | null | undefined): string {
  if (v == null) return '0.00';
  const n = Number(v.toString());
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}

const TOP_N = 20;

/**
 * Aggregates KPIs and breakdowns for non-cancelled orders in `[from, to]` (inclusive by `createdAt`).
 * Uses a small fixed number of queries (no N+1). Payment method is not stored on Order — breakdown uses a single placeholder bucket.
 */
export async function getAnalyticsForRange(from: Date, to: Date): Promise<AnalyticsPayload> {
  const orderWhere: Prisma.OrderWhereInput = {
    createdAt: { gte: from, lte: to },
    status: { not: 'CANCELLED' },
  };

  const [agg, orderRows, itemRows] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: orderWhere,
      select: { createdAt: true, total: true, createdByUserId: true },
    }),
    prisma.orderItem.findMany({
      where: { order: orderWhere },
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const totalOrders = agg._count._all;
  const revenueStr = decimalToMoneyString(agg._sum.total);
  const revenueNum = Number(revenueStr);
  const avgOrderValue =
    totalOrders > 0 && !Number.isNaN(revenueNum) ? (revenueNum / totalOrders).toFixed(2) : '0.00';

  // Sales by local calendar day
  const byDay = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of orderRows) {
    const key = formatLocalYmd(new Date(row.createdAt));
    const prev = byDay.get(key) ?? { revenue: 0, orderCount: 0 };
    prev.orderCount += 1;
    prev.revenue += Number(row.total.toString());
    byDay.set(key, prev);
  }
  const salesByDate: AnalyticsSalesByDateRow[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenue: v.revenue.toFixed(2),
      orderCount: v.orderCount,
    }));

  // Top products by quantity (then revenue)
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const line of itemRows) {
    const prev = byProduct.get(line.productId) ?? {
      name: line.product.name,
      qty: 0,
      revenue: 0,
    };
    prev.qty += line.quantity;
    prev.revenue += Number(line.price.toString()) * line.quantity;
    byProduct.set(line.productId, prev);
  }
  const topProducts: AnalyticsTopProduct[] = [...byProduct.entries()]
    .map(([productId, v]) => ({
      productId,
      productName: v.name,
      quantitySold: v.qty,
      revenue: v.revenue.toFixed(2),
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold || Number(b.revenue) - Number(a.revenue))
    .slice(0, TOP_N);

  // Staff: aggregate from order rows, then load names
  const byStaff = new Map<string | null, { orderCount: number; revenue: number }>();
  for (const row of orderRows) {
    const key = row.createdByUserId;
    const prev = byStaff.get(key) ?? { orderCount: 0, revenue: 0 };
    prev.orderCount += 1;
    prev.revenue += Number(row.total.toString());
    byStaff.set(key, prev);
  }

  const staffIds = [...byStaff.keys()].filter((id): id is string => id != null);
  const users =
    staffIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(users.map((u) => [u.id, u.name] as const));

  const staffPerformance: AnalyticsStaffRow[] = [...byStaff.entries()]
    .map(([userId, v]) => ({
      userId,
      userName: userId ? (nameById.get(userId) ?? 'Unknown') : 'Unassigned',
      orderCount: v.orderCount,
      revenue: v.revenue.toFixed(2),
    }))
    .sort((a, b) => b.revenue.localeCompare(a.revenue, undefined, { numeric: true }));

  const paymentBreakdown: AnalyticsPaymentRow[] = [
    {
      paymentMethod: 'NOT_RECORDED',
      orderCount: totalOrders,
      total: revenueStr,
    },
  ];

  return {
    revenue: revenueStr,
    totalOrders,
    avgOrderValue,
    salesByDate,
    topProducts,
    staffPerformance,
    paymentBreakdown,
  };
}
