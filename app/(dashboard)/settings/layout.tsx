import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { roleHasPermission } from '@/lib/rbac/permissions';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function SettingsLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect('/login');
  if (!roleHasPermission(session.user.role, 'settings:manage')) redirect('/dashboard');

  return <>{children}</>;
}
