'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';

export default function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border bg-background">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">Cafe Console</div>
        <div className="text-xs text-muted-foreground truncate">
          {session?.user?.email ?? 'Unknown user'} · {session?.user?.role ?? '—'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
