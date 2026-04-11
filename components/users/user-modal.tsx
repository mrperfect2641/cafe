'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserPublic } from '@/types/user';

export type UserModalMode = 'view' | 'edit' | 'delete' | null;

type UserModalProps = {
  mode: UserModalMode;
  user: UserPublic | null;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onUserUpdated: (u: UserPublic) => void;
  onUserDeleted: (id: string) => void;
  onLoadingChange?: (loading: boolean) => void;
};

const roleOptions: UserPublic['role'][] = ['ADMIN', 'MANAGER', 'STAFF'];

export function UserModal({
  mode,
  user,
  open,
  onClose,
  currentUserId,
  onUserUpdated,
  onUserDeleted,
  onLoadingChange,
}: UserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserPublic['role']>('STAFF');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || mode !== 'edit') return;
    setName(user.name);
    setRole(user.role);
    setIsActive(user.isActive);
  }, [user, mode, open]);

  async function handleSave() {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, isActive }),
      });
      const json = (await res.json().catch(() => null)) as UserPublic | { error?: string } | null;
      if (!res.ok) {
        toast.error(
          typeof json === 'object' && json && 'error' in json
            ? String(json.error)
            : 'Failed to update user',
        );
        return;
      }
      if (json && 'id' in json) {
        onUserUpdated(json as UserPublic);
        toast.success('User updated');
        onClose();
      }
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSubmitting(false);
      onLoadingChange?.(false);
    }
  }

  async function handleConfirmDelete() {
    if (!user) return;
    setSubmitting(true);
    onLoadingChange?.(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Failed to delete user');
        return;
      }
      onUserDeleted(user.id);
      toast.success('User deleted');
      onClose();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setSubmitting(false);
      onLoadingChange?.(false);
    }
  }

  if (!user) return null;

  const created = new Date(user.createdAt).toLocaleString();

  if (mode === 'view') {
    return (
      <Modal open={open} onClose={onClose} title="User details">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">{created}</dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  if (mode === 'edit') {
    return (
      <Modal open={open} onClose={onClose} title="Edit user" size="lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={role}
              onChange={(e) => setRole(e.target.value as UserPublic['role'])}
              disabled={submitting}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="edit-active"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting || user.id === currentUserId}
            />
            <Label htmlFor="edit-active" className="font-normal">
              Active account
            </Label>
          </div>
          {user.id === currentUserId ? (
            <p className="text-xs text-muted-foreground">
              You cannot deactivate your own account from this screen.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">Email: {user.email} (not editable)</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Modal>
    );
  }

  if (mode === 'delete') {
    return (
      <Modal open={open} onClose={onClose} title="Delete user">
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this user?</p>
        <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm font-medium">{user.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
        <p className="mt-3 text-xs text-destructive">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={submitting}
          >
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    );
  }

  return null;
}
