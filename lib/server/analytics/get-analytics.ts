import type { Prisma } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { formatLocalYmd } from '@/lib/server/analytics/date-range';
import type {
  AnalyticsPayload,
  AnalyticsPaymentRow,
  AnalyticsSalesByDateRow,
  AnalyticsStaffRow,
  AnalyticsTopProduct,
  AovInsights,
  CategoryPerformanceRow,
  GrowthComparison,
  LostRevenueRow,
  ProductMatrixItem,
  ProductMatrixQuadrant,
  SalesByHourRow,
  SmartInsight,
} from '@/types/analytics';

function decimalToMoneyString(v: { toString(): string } | null | undefined): string {
  if (v == null) return '0.00';
  const n = Number(v.toString());
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function localStartOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function localEndOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

const TOP_N = 20;

const orderWhereBase = (from: Date, to: Date): Prisma.OrderWhereInput => ({
  createdAt: { gte: from, lte: to },
  status: { not: 'CANCELLED' },
});

/**
 * Aggregates KPIs and breakdowns for non-cancelled orders in `[from, to]` (inclusive by `createdAt`).
 */
export async function getAnalyticsForRange(from: Date, to: Date): Promise<AnalyticsPayload> {
  const orderWhere = orderWhereBase(from, to);

  const now = new Date();
  const todayStart = localStartOfDay(now);
  const todayEnd = localEndOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = localEndOfDay(yesterdayStart);

  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 6);
  const prev7End = new Date(last7Start);
  prev7End.setMilliseconds(-1);
  const prev7Start = new Date(last7Start);
  prev7Start.setDate(prev7Start.getDate() - 7);

  const sevenDaysAgoCold = new Date(todayStart);
  sevenDaysAgoCold.setDate(sevenDaysAgoCold.getDate() - 7);

  const [
    agg,
    orderRows,
    itemRows,
    todayAgg,
    yesterdayAgg,
    last7Agg,
    prev7Agg,
    oosProducts,
    recentProductIds,
    allProductsBrief,
  ] = await Promise.all([
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
        product: {
          select: {
            name: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: orderWhereBase(todayStart, todayEnd),
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: orderWhereBase(yesterdayStart, yesterdayEnd),
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: orderWhereBase(last7Start, todayEnd),
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: orderWhereBase(prev7Start, prev7End),
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { isAvailable: false },
      select: { id: true, name: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: sevenDaysAgoCold },
          status: { not: 'CANCELLED' },
        },
      },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, isAvailable: true },
    }),
  ]);

  const totalOrders = agg._count._all;
  const revenueStr = decimalToMoneyString(agg._sum.total);
  const revenueNum = Number(revenueStr);
  const avgOrderValue =
    totalOrders > 0 && !Number.isNaN(revenueNum) ? (revenueNum / totalOrders).toFixed(2) : '0.00';

  const totalUnitsSold = itemRows.reduce((s, i) => s + i.quantity, 0);
  const avgUnitsPerOrder =
    totalOrders > 0 ? (totalUnitsSold / totalOrders).toFixed(2) : '0.00';

  let aovSuggestion =
    'Review menu mix and pairings to lift basket size when ready.';
  const aovN = Number(avgOrderValue);
  const upo = totalOrders > 0 ? totalUnitsSold / totalOrders : 0;
  if (totalOrders === 0) {
    aovSuggestion = 'No orders in this range — promote bestsellers once sales pick up.';
  } else if (upo < 1.4) {
    aovSuggestion =
      'Average units per order are low — try bundles, add-ons, or a minimum order incentive.';
  } else if (!Number.isNaN(aovN) && aovN < 150) {
    aovSuggestion =
      'AOV is modest — test combo pricing or upsell higher-ticket drinks with food.';
  } else if (!Number.isNaN(aovN) && aovN >= 400) {
    aovSuggestion = 'Strong AOV — maintain quality and loyalty offers to protect ticket size.';
  }

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

  const byHour = new Map<number, { revenue: number; orderCount: number }>();
  for (const row of orderRows) {
    const h = new Date(row.createdAt).getHours();
    const prev = byHour.get(h) ?? { revenue: 0, orderCount: 0 };
    prev.orderCount += 1;
    prev.revenue += Number(row.total.toString());
    byHour.set(h, prev);
  }
  const salesByHour: SalesByHourRow[] = Array.from({ length: 24 }, (_, hour) => {
    const v = byHour.get(hour) ?? { revenue: 0, orderCount: 0 };
    return {
      hour,
      revenue: v.revenue.toFixed(2),
      orderCount: v.orderCount,
    };
  });

  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  const byCategory = new Map<string, { name: string; qty: number; revenue: number }>();

  for (const line of itemRows) {
    const prev = byProduct.get(line.productId) ?? {
      name: line.product.name,
      qty: 0,
      revenue: 0,
    };
    prev.qty += line.quantity;
    prev.revenue += Number(line.price.toString()) * line.quantity;
    byProduct.set(line.productId, prev);

    const cid = line.product.categoryId;
    const cname = line.product.category.name;
    const cPrev = byCategory.get(cid) ?? { name: cname, qty: 0, revenue: 0 };
    cPrev.qty += line.quantity;
    cPrev.revenue += Number(line.price.toString()) * line.quantity;
    byCategory.set(cid, cPrev);
  }

  const productRows = [...byProduct.entries()].map(([productId, v]) => ({
    productId,
    productName: v.name,
    quantitySold: v.qty,
    revenue: v.revenue.toFixed(2),
    revenueNum: v.revenue,
    qtyNum: v.qty,
  }));

  const revs = productRows.map((p) => p.revenueNum);
  const qtys = productRows.map((p) => p.qtyNum);
  const medR = median(revs);
  const medQ = median(qtys);

  const productMatrix: ProductMatrixItem[] = productRows.map((p) => {
    let quadrant: ProductMatrixQuadrant;
    if (productRows.length === 0) {
      quadrant = 'improve';
    } else if (p.revenueNum >= medR && p.qtyNum >= medQ) {
      quadrant = 'stars';
    } else if (p.revenueNum >= medR && p.qtyNum < medQ) {
      quadrant = 'cash_cows';
    } else if (p.revenueNum < medR && p.qtyNum >= medQ) {
      quadrant = 'improve';
    } else {
      quadrant = 'remove';
    }
    return {
      productId: p.productId,
      productName: p.productName,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
      quadrant,
    };
  });

  const topProducts: AnalyticsTopProduct[] = productRows
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold || Number(b.revenue) - Number(a.revenue))
    .slice(0, TOP_N);

  const categoryPerformance: CategoryPerformanceRow[] = [...byCategory.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      categoryName: v.name,
      revenue: v.revenue.toFixed(2),
      quantitySold: v.qty,
    }))
    .sort((a, b) => Number(b.revenue) - Number(a.revenue));

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

  const soldRecent = new Set(recentProductIds.map((r) => r.productId));
  const lostRevenue: LostRevenueRow[] = [
    ...oosProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      kind: 'out_of_stock' as const,
      note: 'Unavailable — restock or hide until back in menu.',
    })),
    ...allProductsBrief
      .filter((p) => p.isAvailable && !soldRecent.has(p.id))
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        kind: 'cold' as const,
        note: 'No sales in the last 7 days — review placement, price, or remove.',
      })),
  ];

  const tr = Number(todayAgg._sum.total?.toString() ?? 0) || 0;
  const yr = Number(yesterdayAgg._sum.total?.toString() ?? 0) || 0;
  const l7 = Number(last7Agg._sum.total?.toString() ?? 0) || 0;
  const p7 = Number(prev7Agg._sum.total?.toString() ?? 0) || 0;

  const growth: GrowthComparison = {
    todayVsYesterday: {
      current: {
        revenue: decimalToMoneyString(todayAgg._sum.total),
        orders: todayAgg._count._all,
      },
      previous: {
        revenue: decimalToMoneyString(yesterdayAgg._sum.total),
        orders: yesterdayAgg._count._all,
      },
      revenueChangePct: pctChange(tr, yr),
    },
    rolling7VsPrev7: {
      current: {
        revenue: decimalToMoneyString(last7Agg._sum.total),
        orders: last7Agg._count._all,
      },
      previous: {
        revenue: decimalToMoneyString(prev7Agg._sum.total),
        orders: prev7Agg._count._all,
      },
      revenueChangePct: pctChange(l7, p7),
    },
  };

  const peakHourRow = salesByHour.reduce(
    (best, row) => {
      const r = Number(row.revenue);
      const br = Number(best.revenue);
      return r > br ? row : best;
    },
    salesByHour[0]!,
  );

  const smartInsights: SmartInsight[] = [];
  if (topProducts[0]) {
    smartInsights.push({
      id: 'top-product',
      tone: 'positive',
      title: 'Top mover',
      detail: `${topProducts[0].productName} led units in this range (${topProducts[0].quantitySold} sold).`,
    });
  }
  if (totalOrders > 0 && Number(peakHourRow.revenue) > 0) {
    smartInsights.push({
      id: 'peak-hour',
      tone: 'neutral',
      title: 'Peak hour',
      detail: `Highest sales volume landed around ${peakHourRow.hour}:00–${peakHourRow.hour + 1}:00 (selected range).`,
    });
  }
  const removeCandidates = productMatrix.filter((p) => p.quadrant === 'remove').slice(0, 3);
  if (removeCandidates.length > 0) {
    smartInsights.push({
      id: 'low-performers',
      tone: 'warning',
      title: 'Menu cleanup candidates',
      detail: `${removeCandidates.length} item(s) sit in the “remove” quadrant — low revenue and low volume vs peers.`,
    });
  }
  if (growth.todayVsYesterday.revenueChangePct != null && growth.todayVsYesterday.revenueChangePct > 5) {
    smartInsights.push({
      id: 'growth-day',
      tone: 'positive',
      title: 'Day-over-day revenue',
      detail: `Today is up about ${growth.todayVsYesterday.revenueChangePct.toFixed(0)}% vs yesterday on revenue.`,
    });
  }
  if (growth.todayVsYesterday.revenueChangePct != null && growth.todayVsYesterday.revenueChangePct < -5) {
    smartInsights.push({
      id: 'dip-day',
      tone: 'warning',
      title: 'Day-over-day dip',
      detail: `Today trails yesterday by about ${Math.abs(growth.todayVsYesterday.revenueChangePct).toFixed(0)}% on revenue — check staffing and promos.`,
    });
  }

  const aovInsights: AovInsights = {
    avgOrderValue,
    avgUnitsPerOrder,
    suggestion: aovSuggestion,
  };

  return {
    revenue: revenueStr,
    totalOrders,
    avgOrderValue,
    salesByDate,
    topProducts,
    staffPerformance,
    paymentBreakdown,
    productMatrix,
    salesByHour,
    categoryPerformance,
    lostRevenue,
    growth,
    aovInsights,
    smartInsights,
  };
}
