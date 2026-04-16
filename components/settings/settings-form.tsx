'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { invalidateSettingsCache } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS, normalizeAdminSettings, type AdminSettings } from '@/lib/settings/defaults';

function SettingsSection({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  helper,
  disabled,
}: Readonly<{
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  helper?: string;
  disabled?: boolean;
}>) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </div>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}

export function SettingsForm() {
  const [form, setForm] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !data) {
        setError('Failed to load settings');
        return;
      }
      setForm(normalizeAdminSettings(data));
    } catch {
      setError('Network error while loading settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const update = useCallback(<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSave = useMemo(() => !loading && !saving, [loading, saving]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !data) {
        toast.error('Failed to save settings');
        return;
      }
      setForm(normalizeAdminSettings(data));
      invalidateSettingsCache();
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => void loadSettings()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="Business info" description="Core details displayed in billing and invoice flows.">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business name</Label>
          <Input
            id="business_name"
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_phone">Phone</Label>
          <Input
            id="business_phone"
            value={form.business_phone}
            onChange={(e) => update('business_phone', e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="business_address">Address</Label>
          <Input
            id="business_address"
            value={form.business_address}
            onChange={(e) => update('business_address', e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gst_number">GST number</Label>
          <Input
            id="gst_number"
            value={form.gst_number}
            onChange={(e) => update('gst_number', e.target.value)}
            disabled={saving}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Billing settings" description="Controls tax and charge defaults for checkout.">
        <div className="space-y-2">
          <Label htmlFor="tax_percentage">Tax percentage</Label>
          <Input
            id="tax_percentage"
            type="number"
            min={0}
            step="0.01"
            value={form.tax_percentage}
            onChange={(e) => update('tax_percentage', Number(e.target.value || 0))}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_charge">Service charge</Label>
          <Input
            id="service_charge"
            type="number"
            min={0}
            step="0.01"
            value={form.service_charge}
            onChange={(e) => update('service_charge', Number(e.target.value || 0))}
            disabled={saving}
          />
        </div>
        <div className="md:col-span-2">
          <Toggle
            checked={form.enable_discounts}
            onChange={(v) => update('enable_discounts', v)}
            label="Enable discounts"
            helper="Allow discount entry in billing workflow."
            disabled={saving}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Payment settings" description="Enable or disable methods shown in billing.">
        <Toggle
          checked={form.payment_methods.includes('cash')}
          onChange={(checked) =>
            update(
              'payment_methods',
              checked
                ? [...new Set([...form.payment_methods, 'cash'])]
                : form.payment_methods.filter((m) => m !== 'cash'),
            )
          }
          label="Cash"
          disabled={saving}
        />
        <Toggle
          checked={form.payment_methods.includes('upi')}
          onChange={(checked) =>
            update(
              'payment_methods',
              checked
                ? [...new Set([...form.payment_methods, 'upi'])]
                : form.payment_methods.filter((m) => m !== 'upi'),
            )
          }
          label="UPI"
          disabled={saving}
        />
        <Toggle
          checked={form.payment_methods.includes('card')}
          onChange={(checked) =>
            update(
              'payment_methods',
              checked
                ? [...new Set([...form.payment_methods, 'card'])]
                : form.payment_methods.filter((m) => m !== 'card'),
            )
          }
          label="Card"
          disabled={saving}
        />
      </SettingsSection>

      <SettingsSection title="Notifications" description="Control key owner alerts and reminders.">
        <Toggle
          checked={form.notify_low_sales}
          onChange={(v) => update('notify_low_sales', v)}
          label="Low sales alerts"
          disabled={saving}
        />
        <Toggle
          checked={form.notify_inactivity}
          onChange={(v) => update('notify_inactivity', v)}
          label="Inactivity alerts"
          disabled={saving}
        />
      </SettingsSection>

      <SettingsSection title="Operational settings" description="Opening and closing times used across reports and ops.">
        <div className="space-y-2">
          <Label htmlFor="opening_time">Opening time</Label>
          <Input
            id="opening_time"
            type="time"
            value={form.opening_time}
            onChange={(e) => update('opening_time', e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closing_time">Closing time</Label>
          <Input
            id="closing_time"
            type="time"
            value={form.closing_time}
            onChange={(e) => update('closing_time', e.target.value)}
            disabled={saving}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="System preferences" description="Default UI and formatting preferences.">
        <Toggle
          checked={form.dark_mode_default}
          onChange={(v) => update('dark_mode_default', v)}
          label="Dark mode default"
          disabled={saving}
        />
        <div className="space-y-2">
          <Label htmlFor="time_format">Time format</Label>
          <select
            id="time_format"
            value={form.time_format}
            onChange={(e) => update('time_format', e.target.value as '12h' | '24h')}
            disabled={saving}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </div>
      </SettingsSection>

      <SettingsSection title="Security" description="Session behavior and emergency actions.">
        <div className="space-y-2">
          <Label htmlFor="session_timeout">Session timeout (minutes)</Label>
          <Input
            id="session_timeout"
            type="number"
            min={5}
            step={1}
            value={form.session_timeout}
            onChange={(e) => update('session_timeout', Number(e.target.value || 0))}
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label>Force logout</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.message('Force logout will be wired in next step.')}
            disabled={saving}
          >
            Force logout all active sessions
          </Button>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
}
