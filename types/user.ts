/** User shape returned by GET /api/users (no password). */
export type UserPublic = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  createdAt: string;
};
