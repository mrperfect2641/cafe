import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac/requirePermission';

export async function GET() {
  const auth = await requirePermission('staff:manage');
  if (!auth.ok) return auth.response;

  const rows = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const users = rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return NextResponse.json(users);
}
