import type { OrderStatus } from '@/app/generated/prisma/client';
import type { Prisma } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type OrderListFilters = {
  search?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
  payment?: string;
};

/** Row returned by GET /api/orders (JSON-safe). */
export type OrderListRow = {
  id: string;
  customerName: string;
  total: string;
  tax: string;
  discount: string;
  status: OrderStatus;
  createdAt: string;
  itemsCount: number;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: string;
    product: {
      id: string;
      name: string;
      price: string;
      categoryId: string;
      isAvailable: boolean;
      createdAt: string;
    };
  }>;
  /** Reserved when a Payment model exists; currently always null. */
  payment: null;
};

function buildWhere(filters: OrderListFilters): Prisma.OrderWhereInput {
  const andParts: Prisma.OrderWhereInput[] = [];

  const search = filters.search?.trim();
  if (search) {
    andParts.push({
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } },
      ],
    });
  }

  if (filters.status) {
    andParts.push({ status: filters.status });
  }

  // Payment model is not persisted yet. Keep filter contract stable:
  // - payment=NOT_RECORDED => include all known rows
  // - any other payment filter => currently no matches
  if (filters.payment && filters.payment !== 'NOT_RECORDED') {
    andParts.push({ id: '__NO_MATCH_FOR_PAYMENT__' });
  }

  const createdRange: Prisma.DateTimeFilter = {};
  if (filters.fromDate) {
    createdRange.gte = filters.fromDate;
  }
  if (filters.toDate) {
    createdRange.lte = filters.toDate;
  }
  if (Object.keys(createdRange).length > 0) {
    andParts.push({ createdAt: createdRange });
  }

  if (andParts.length === 0) return {};
  if (andParts.length === 1) return andParts[0]!;
  return { AND: andParts };
}

function serializeOrder(
  row: Prisma.OrderGetPayload<{
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true;
              name: true;
              price: true;
              categoryId: true;
              isAvailable: true;
              createdAt: true;
            };
          };
        };
      };
    };
  }>,
): OrderListRow {
  return {
    id: row.id,
    customerName: row.customerName,
    total: row.total.toString(),
    tax: row.tax.toString(),
    discount: row.discount.toString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    itemsCount: row.items.length,
    items: row.items.map((line) => ({
      id: line.id,
      orderId: line.orderId,
      productId: line.productId,
      quantity: line.quantity,
      price: line.price.toString(),
      product: {
        id: line.product.id,
        name: line.product.name,
        price: line.product.price.toString(),
        categoryId: line.product.categoryId,
        isAvailable: line.product.isAvailable,
        createdAt: line.product.createdAt.toISOString(),
      },
    })),
    payment: null,
  };
}

/** Lists saved POS orders, newest first (caller enforces `orders:read`). */
export async function getOrdersForSession(params: {
  filters: OrderListFilters;
}): Promise<OrderListRow[]> {
  const where = buildWhere(params.filters);

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              categoryId: true,
              isAvailable: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return rows.map(serializeOrder);
}
