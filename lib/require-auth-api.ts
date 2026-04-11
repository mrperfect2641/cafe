import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export type AuthSessionResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/** Any signed-in user (for menu read APIs). */
export async function requireAuthSession(): Promise<AuthSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, session };
}
