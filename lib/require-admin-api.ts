import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export type AdminSessionResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (session.user.role !== 'ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, session };
}
