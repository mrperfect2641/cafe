import { UserTable } from '@/components/users/user-table';

export default function UsersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View, edit, or remove staff accounts. Admin access only.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
