'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type UserFiltersState = {
  search: string;
  role: '' | 'ADMIN' | 'MANAGER' | 'STAFF';
  status: '' | 'active' | 'inactive';
};

type UserFiltersProps = {
  value: UserFiltersState;
  onChange: (next: UserFiltersState) => void;
  onApply: () => void;
  disabled?: boolean;
};

export function UserFilters({ value, onChange, onApply, disabled = false }: Readonly<UserFiltersProps>) {
  const set = <K extends keyof UserFiltersState>(key: K, next: UserFiltersState[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <Input
            placeholder="Search by name or email"
            value={value.search}
            onChange={(e) => set('search', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-2">
          <select
            value={value.role}
            onChange={(e) => set('role', e.target.value as UserFiltersState['role'])}
            disabled={disabled}
            className="h-8 w-full rounded-lg border border-[#222] bg-[#111] px-2.5 text-sm text-white"
          >
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            value={value.status}
            onChange={(e) => set('status', e.target.value as UserFiltersState['status'])}
            disabled={disabled}
            className="h-8 w-full rounded-lg border border-[#222] bg-[#111] px-2.5 text-sm text-white"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="button" className="w-full" onClick={onApply} disabled={disabled}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
