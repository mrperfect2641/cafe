import type { ReactNode } from 'react';

/**
 * Reference: index2.html — split card (marketing left + forms right).
 */
export function AuthSplitShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="flex h-auto min-h-[32rem] w-full max-w-[950px] flex-col overflow-hidden rounded-xl bg-[#151515] shadow-[0_0_40px_rgba(0,0,0,0.6)] md:h-[560px] md:max-h-[90vh] md:flex-row">
        {children}
      </div>
    </div>
  );
}

export function AuthMarketingPanel() {
  return (
    <div className="flex w-full flex-col justify-center bg-gradient-to-br from-[#ff9800] to-[#ff5722] px-8 py-10 text-center text-black md:w-[45%] md:px-10 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">☕ Smart Cafe</h1>
      <p className="mt-2 text-sm font-medium">Operation Management System</p>
      <p className="mt-6 text-sm leading-relaxed">
        Secure role-based access for Admin, Manager &amp; Staff.
      </p>
    </div>
  );
}
