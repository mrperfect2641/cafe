import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Permission } from '@/lib/rbac/permissions';
import { roleHasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/app/generated/prisma/client';

export type PermissionSessionResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/** Require sign-in and a single permission (403 if the role lacks it). */
export async function requirePermission(permission: Permission): Promise<PermissionSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = session.user.role as Role | undefined;
  if (!role || !roleHasPermission(role, permission)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, session };
}
