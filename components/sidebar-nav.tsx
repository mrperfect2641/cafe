'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingBag,
  Users,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  roles: Array<'ADMIN' | 'MANAGER' | 'STAFF'>;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['ADMIN', 'MANAGER'],
    icon: LayoutDashboard,
  },
  {
    href: '/users',
    label: 'Users',
    roles: ['ADMIN', 'MANAGER'],
    icon: Users,
  },
  {
    href: '/billing',
    label: 'Billing',
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    icon: ReceiptText,
  },
  {
    href: '/orders',
    label: 'Orders',
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    icon: ClipboardList,
  },
  {
    href: '/menu',
    label: 'Menu',
    roles: ['ADMIN', 'MANAGER'],
    icon: ShoppingBag,
  },
  {
    href: '/reports',
    label: 'Reports',
    roles: ['ADMIN'],
    icon: BarChart3,
  },
  {
    href: '/settings',
    label: 'Settings',
    roles: ['ADMIN'],
    icon: Settings,
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <nav className="flex flex-col gap-1">
      {navItems
        .filter((item) => (role ? item.roles.includes(role) : false))
        .map((item) => {
          const active =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-ring/20 hover:text-foreground',
                active ? 'bg-sidebar-ring/25 text-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
