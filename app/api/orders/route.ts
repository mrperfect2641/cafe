import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/require-auth-api';

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.coerce.number().positive(),
});

const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  items: z.array(lineSchema).min(1),
  tax: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  total: z.coerce.number().positive(),
});

const TOTAL_EPS = 0.06;

export async function POST(req: Request) {
  const auth = await requireAuthSession();
  if (!auth.ok) return auth.response;

  const role = auth.session.user.role;
  if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { customerName, items, tax, discount, total } = parsed.data;

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const expectedTotal = subtotal + tax - discount;
  if (Math.abs(expectedTotal - total) > TOTAL_EPS) {
    return NextResponse.json({ error: 'Total does not match line items' }, { status: 400 });
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isAvailable: true },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products are invalid' }, { status: 400 });
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        customerName,
        total: total.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        status: 'CREATED',
      },
    });

    for (const line of items) {
      await tx.orderItem.create({
        data: {
          orderId: o.id,
          productId: line.productId,
          quantity: line.quantity,
          price: line.price.toFixed(2),
        },
      });
    }

    return o;
  });

  return NextResponse.json({
    id: order.id,
    customerName: order.customerName,
    total: order.total.toString(),
    tax: order.tax.toString(),
    discount: order.discount.toString(),
    createdAt: order.createdAt.toISOString(),
  });
}
