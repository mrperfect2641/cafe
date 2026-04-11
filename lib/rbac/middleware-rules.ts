import type { Permission } from '@/lib/rbac/permissions';

/** Dashboard page segments: required permission to enter (JWT role checked in middleware). */
export function pagePermissionForPath(pathname: string): Permission | null {
  if (pathname.startsWith('/reports')) {
    return 'analytics:admin';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'reports:view';
  }
  if (pathname.startsWith('/users')) {
    return 'staff:manage';
  }
  if (pathname.startsWith('/menu')) {
    return 'menu:write';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings:manage';
  }
  if (pathname.startsWith('/billing')) {
    return 'billing:checkout';
  }
  if (pathname.startsWith('/orders')) {
    return 'orders:read';
  }
  return null;
}

export type ApiAccess = 'public' | 'session' | Permission;

/**
 * Coarse API gate aligned with route handlers (defense in depth).
 * Mutations still validated in each route with `requirePermission`.
 */
export function apiAccessFor(pathname: string, method: string): ApiAccess {
  if (pathname.startsWith('/api/auth')) {
    return 'public';
  }

  if (pathname.startsWith('/api/users')) {
    return 'staff:manage';
  }

  if (pathname.startsWith('/api/categories')) {
    return method === 'GET' ? 'session' : 'menu:write';
  }

  if (pathname.startsWith('/api/products')) {
    return method === 'GET' ? 'session' : 'menu:write';
  }

  if (pathname.startsWith('/api/orders')) {
    return method === 'POST' ? 'billing:checkout' : 'session';
  }

  if (pathname.startsWith('/api/analytics')) {
    return 'analytics:admin';
  }

  return 'session';
}
