import { getServerSession } from 'next-auth/next';
import { UserTable } from '@/components/users/user-table';
import { authOptions } from '@/lib/auth';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const isManager = session?.user?.role === 'MANAGER';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isManager ? 'Staff Management' : 'User management'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isManager
            ? 'View, filter, and manage staff accounts from a single dashboard.'
            : 'View, filter, and manage team accounts from a single dashboard.'}
        </p>
      </div>
      <UserTable />
    </div>
  );
}
