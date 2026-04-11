'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserPublic } from '@/types/user';

type UserRowProps = {
  user: UserPublic;
  currentUserId: string;
  busy: boolean;
  onView: (user: UserPublic) => void;
  onEdit: (user: UserPublic) => void;
  onDelete: (user: UserPublic) => void;
};

export function UserRow({ user, currentUserId, busy, onView, onEdit, onDelete }: UserRowProps) {
  const isSelf = user.id === currentUserId;

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/40">
      <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={
            user.isActive
              ? 'inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'
              : 'inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={busy}
            onClick={() => onView(user)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={busy}
            onClick={() => onEdit(user)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy || isSelf}
            title={isSelf ? 'You cannot delete your own account' : undefined}
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
