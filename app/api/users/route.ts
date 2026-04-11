import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/require-admin-api';

export async function GET() {
  const auth = await requireAdminSession();
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
