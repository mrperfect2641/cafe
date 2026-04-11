import type { Role } from '@/app/generated/prisma/client';

/** Fine-grained permissions for APIs, middleware, and future UI checks */
export const PERMISSIONS = [
  'billing:checkout',
  'orders:read',
  'orders:update',
  'menu:read',
  'menu:write',
  'staff:manage',
  'reports:view',
  'analytics:admin',
  'settings:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/**
 * ADMIN: full access.
 * MANAGER: menu + staff + reports + POS (billing:checkout keeps existing manager POS behavior).
 * STAFF: billing and orders only; menu catalog uses authenticated GET on APIs (no menu:write).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: ALL,
  MANAGER: [
    'billing:checkout',
    'orders:read',
    'orders:update',
    'menu:read',
    'menu:write',
    'staff:manage',
    'reports:view',
  ],
  STAFF: ['billing:checkout', 'orders:read', 'orders:update', 'menu:read'],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}
