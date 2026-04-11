import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function OrdersLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect('/login');

  const role = session.user.role;
  if (role !== 'STAFF' && role !== 'MANAGER' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
