import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as {session?.user?.role}. Choose a section from the navigation.
      </p>
    </div>
  );
}
