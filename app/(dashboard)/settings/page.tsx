import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure business, billing, payment, notification, and security preferences.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
