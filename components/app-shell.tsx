import type { ReactNode } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import TopNav from '@/components/top-nav';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
          <div className="h-14 px-4 flex items-center border-b border-sidebar-border">
            <div className="text-sm font-semibold">Cafe Console</div>
          </div>
          <div className="flex-1 px-2 py-4">
            <SidebarNav />
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
