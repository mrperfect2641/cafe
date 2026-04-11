import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/require-auth-api';
import { requirePermission } from '@/lib/rbac/requirePermission';

export async function GET(req: Request) {
  const auth = await requireAuthSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  if (!categoryId || !categoryId.trim()) {
    return NextResponse.json({ error: 'categoryId query is required' }, { status: 400 });
  }

  const rows = await prisma.product.findMany({
    where: { categoryId: categoryId.trim() },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      price: true,
      categoryId: true,
      isAvailable: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    rows.map((p) => ({
      ...p,
      price: p.price.toString(),
      createdAt: p.createdAt.toISOString(),
    })),
  );
}

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.coerce.number().positive().finite(),
  categoryId: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const auth = await requirePermission('menu:write');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const priceStr = parsed.data.price.toFixed(2);

  const created = await prisma.product.create({
    data: {
      name: parsed.data.name,
      price: priceStr,
      categoryId: parsed.data.categoryId,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      categoryId: true,
      isAvailable: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ...created,
    price: created.price.toString(),
    createdAt: created.createdAt.toISOString(),
  });
}
