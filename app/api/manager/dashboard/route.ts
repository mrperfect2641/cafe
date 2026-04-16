import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/requirePermission';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function endOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export async function GET() {
  const auth = await requirePermission('reports:view');
  if (!auth.ok) return auth.response;

  const from = startOfToday();
  const to = endOfToday();

  const [todayOrders, recentOrdersRows, menuCounts] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        createdByUserId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        customerName: true,
        total: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.product.aggregate({
      _count: { _all: true },
      where: {},
    }),
  ]);

  const pendingOrders = todayOrders.filter((o) => o.status === 'CREATED').length;
  const completedOrders = todayOrders.filter((o) => o.status === 'FULFILLED').length;

  const staffOrderMap = new Map<string, number>();
  for (const order of todayOrders) {
    if (!order.createdByUserId) continue;
    staffOrderMap.set(order.createdByUserId, (staffOrderMap.get(order.createdByUserId) ?? 0) + 1);
  }

  const staffIds = [...staffOrderMap.keys()];
  const staffRows =
    staffIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, name: true },
        })
      : [];

  const staffPerformance = staffRows
    .map((u) => ({
      userId: u.id,
      staffName: u.name,
      ordersHandled: staffOrderMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.ordersHandled - a.ordersHandled);

  const outOfStockItems = await prisma.product.count({
    where: { isAvailable: false },
  });

  return NextResponse.json({
    totalOrders: todayOrders.length,
    pendingOrders,
    completedOrders,
    recentOrders: recentOrdersRows.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total.toString(),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    staffPerformance,
    menuStatus: {
      totalItems: menuCounts._count._all,
      outOfStockItems,
    },
  });
}
