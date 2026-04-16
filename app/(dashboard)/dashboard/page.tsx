import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { ManagerDashboard } from '@/components/dashboard/manager-dashboard';

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isManager ? 'Manager dashboard' : 'Admin dashboard'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isManager
            ? 'Operations overview for orders, staff, and menu execution.'
            : `Business snapshot for ${session?.user?.role?.toLowerCase() ?? 'account'} with live revenue and order insights.`}
        </p>
      </div>
      {isAdmin ? <DashboardOverview /> : isManager ? <ManagerDashboard /> : null}
    </div>
  );
}
