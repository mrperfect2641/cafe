import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/requirePermission';

type RouteContext = { params: Promise<{ id: string }> };

function toMoneyString(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requirePermission('menu:read');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const productId = id?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      price: true,
      isAvailable: true,
      category: { select: { name: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const lines = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: { not: 'CANCELLED' },
      },
    },
    select: {
      quantity: true,
      price: true,
      order: { select: { createdAt: true } },
    },
  });

  let totalSold = 0;
  let totalRevenue = 0;
  let lastOrderedAt: Date | null = null;

  for (const line of lines) {
    totalSold += line.quantity;
    totalRevenue += Number(line.price.toString()) * line.quantity;
    if (!lastOrderedAt || line.order.createdAt > lastOrderedAt) {
      lastOrderedAt = line.order.createdAt;
    }
  }

  // Ingredient/recipe entities are not present in current schema; return empty safely.
  const ingredients: Array<{ name: string; quantity: number; unit: string }> = [];
  const cost = 0;
  const profit = totalRevenue - cost;

  return NextResponse.json({
    id: product.id,
    name: product.name,
    price: product.price.toString(),
    category: product.category.name,
    status: product.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
    totalSold,
    totalRevenue: toMoneyString(totalRevenue),
    lastOrderedAt: lastOrderedAt ? lastOrderedAt.toISOString() : null,
    ingredients,
    cost: toMoneyString(cost),
    profit: toMoneyString(profit),
  });
}
