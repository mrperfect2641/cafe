import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '500', '600', '700'],
});

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className={`${poppins.className} min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1c1c1c] text-white antialiased`}
    >
      {children}
    </div>
  );
}
