import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) redirect('/login');

  const role = session.user.role;
  const redirectTo = role === 'ADMIN' || role === 'MANAGER' ? '/dashboard' : '/billing';

  redirect(redirectTo);
}
