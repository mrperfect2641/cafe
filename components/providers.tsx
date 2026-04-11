'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

/** React 19: avoid client-tree `<script>` warning from next-themes while keeping SSR theme script. */
const themeScriptProps =
  typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      scriptProps={themeScriptProps}
    >
      <SessionProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </SessionProvider>
    </ThemeProvider>
  );
}
