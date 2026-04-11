import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Role } from '@/app/generated/prisma/client';
import { roleHasPermission } from '@/lib/rbac/permissions';
import type { Permission } from '@/lib/rbac/permissions';
import { apiAccessFor, pagePermissionForPath } from '@/lib/rbac/middleware-rules';

function forbiddenApi() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Public app pages
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api');

  if (isApi) {
    const access = apiAccessFor(pathname, method);
    if (access === 'public') {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.sub) {
      return forbiddenApi();
    }

    const role = token.role as Role | undefined;
    if (!role) {
      return forbiddenApi();
    }

    if (access === 'session') {
      return NextResponse.next();
    }

    if (!roleHasPermission(role, access as Permission)) {
      return forbiddenApi();
    }

    return NextResponse.next();
  }

  // App Router dashboard segments (under (dashboard) group, URLs are still /dashboard, /billing, …)
  const pagePerm = pagePermissionForPath(pathname);
  if (pagePerm === null) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub) {
    const signIn = new URL('/login', req.url);
    signIn.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signIn);
  }

  const role = token.role as Role | undefined;
  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!roleHasPermission(role, pagePerm)) {
    return NextResponse.redirect(new URL('/billing', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/billing/:path*',
    '/orders/:path*',
    '/menu/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/users/:path*',
    '/api/:path*',
  ],
};
