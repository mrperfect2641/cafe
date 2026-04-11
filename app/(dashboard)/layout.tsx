import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import AppShell from '@/components/app-shell';

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
