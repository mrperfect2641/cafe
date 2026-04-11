'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { UserRow } from '@/components/users/user-row';
import { UserModal, type UserModalMode } from '@/components/users/user-modal';
import type { UserPublic } from '@/types/user';

export function UserTable() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? '';

  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setFetchError(j?.error ?? `Request failed (${res.status})`);
        setUsers([]);
        return;
      }
      const data = (await res.json()) as UserPublic[];
      setUsers(data);
    } catch {
      setFetchError('Network error');
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openModal(mode: UserModalMode, user: UserPublic) {
    setSelectedUser(user);
    setModalMode(mode);
    setModalOpen(true);
  }

  function closeModal() {
    setActionLoading(false);
    setModalOpen(false);
    setModalMode(null);
    setSelectedUser(null);
  }

  const handleUserUpdated = useCallback((updated: UserPublic) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, []);

  const handleUserDeleted = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading users…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{fetchError}</p>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-primary underline"
          onClick={() => void loadUsers()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    currentUserId={currentUserId}
                    busy={actionLoading}
                    onView={(user) => openModal('view', user)}
                    onEdit={(user) => openModal('edit', user)}
                    onDelete={(user) => openModal('delete', user)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        mode={modalMode}
        user={selectedUser}
        open={modalOpen}
        onClose={closeModal}
        currentUserId={currentUserId}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
        onLoadingChange={setActionLoading}
      />
    </>
  );
}
