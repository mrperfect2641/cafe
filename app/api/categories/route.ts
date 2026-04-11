import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/require-auth-api';
import { requirePermission } from '@/lib/rbac/requirePermission';

export async function GET() {
  const auth = await requireAuthSession();
  if (!auth.ok) return auth.response;

  const rows = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
}

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await prisma.category.create({
    data: { name: parsed.data.name },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
  });
}
