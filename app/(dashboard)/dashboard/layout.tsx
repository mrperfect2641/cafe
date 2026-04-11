import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

/** Staff home is Billing (reference UI); Managers/Admins use Dashboard analytics. */
export default async function DashboardSectionLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect('/login');
  if (session.user.role === 'STAFF') redirect('/billing');

  return <>{children}</>;
}
