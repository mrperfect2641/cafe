import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { OrderStatus } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrdersForSession } from '@/lib/server/orders/get-orders';
import { requirePermission } from '@/lib/rbac/requirePermission';

const ORDER_STATUSES = ['CREATED', 'PAID', 'FULFILLED', 'CANCELLED'] as const satisfies readonly OrderStatus[];

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.coerce.number().positive(),
});

const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  tableNo: z.string().trim().max(50).optional(),
  paymentMethod: z.enum(['cash', 'upi', 'card']).optional(),
  items: z.array(lineSchema).min(1),
  tax: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  total: z.coerce.number().positive(),
});

const TOTAL_EPS = 0.06;

function parseYmdToLocalStart(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function parseYmdToLocalEnd(ymd: string): Date | null {
  const start = parseYmdToLocalStart(ymd);
  if (!start) return null;
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function GET(req: Request) {
  const auth = await requirePermission('orders:read');
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || undefined;
  const payment = searchParams.get('payment')?.trim() || undefined;

  const statusRaw = searchParams.get('status')?.trim();
  let status: OrderStatus | undefined;
  if (statusRaw) {
    if (!(ORDER_STATUSES as readonly string[]).includes(statusRaw)) {
      return NextResponse.json(
        { error: 'Invalid status', allowed: ORDER_STATUSES },
        { status: 400 },
      );
    }
    status = statusRaw as OrderStatus;
  }

  const fromRaw = searchParams.get('fromDate')?.trim();
  const toRaw = searchParams.get('toDate')?.trim();
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (fromRaw) {
    const d = parseYmdToLocalStart(fromRaw);
    if (!d) {
      return NextResponse.json({ error: 'Invalid fromDate (use YYYY-MM-DD)' }, { status: 400 });
    }
    fromDate = d;
  }
  if (toRaw) {
    const d = parseYmdToLocalEnd(toRaw);
    if (!d) {
      return NextResponse.json({ error: 'Invalid toDate (use YYYY-MM-DD)' }, { status: 400 });
    }
    toDate = d;
  }

  const orders = await getOrdersForSession({
    filters: { search, status, fromDate, toDate, payment },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2);
  const pendingOrders = orders.filter((order) => order.status === 'CREATED').length;
  const completedOrders = orders.filter((order) => order.status === 'FULFILLED').length;

  return NextResponse.json({
    orders,
    summary: {
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requirePermission('billing:checkout');
  if (!auth.ok) return auth.response;
  if (auth.session.user.role === 'MANAGER') {
    return NextResponse.json({ error: 'Managers are not allowed to create orders' }, { status: 403 });
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
        createdByUserId: auth.session.user.id,
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
