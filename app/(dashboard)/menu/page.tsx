import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MenuManagement } from '@/components/menu/menu-management';

export default async function MenuPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Menu management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse categories and items. Admins can add categories, add items, and delete items.
        </p>
      </div>
      <MenuManagement isAdmin={isAdmin} />
    </div>
  );
}
