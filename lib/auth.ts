import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { Role as RoleType } from '@/app/generated/prisma/client';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Returned object ends up in the `user` param of the `jwt` callback.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role satisfies RoleType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id?: string; role?: RoleType };
        if (typeof u.id === 'string') token.id = u.id;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as RoleType;
      }
      return session;
    },
  },
};

// Convenience helpers for role checks in server components.
export function allowedRoles(role: RoleType, ...allowed: RoleType[]) {
  return allowed.includes(role);
}
