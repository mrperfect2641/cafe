import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MenuInsights } from '@/components/menu/menu-insights';
import { MenuManagement } from '@/components/menu/menu-management';

export default async function MenuPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const canManageMenu = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAdmin ? 'Menu insights' : 'Menu management'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? 'Read-only menu analytics including top sellers, pricing, and product performance.'
            : 'Browse categories and items. Managers can add categories, add items, and delete items.'}
        </p>
      </div>
      {isAdmin ? <MenuInsights /> : <MenuManagement canManageMenu={canManageMenu} />}
    </div>
  );
}
