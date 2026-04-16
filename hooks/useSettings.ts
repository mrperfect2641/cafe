'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, normalizeAdminSettings, type AdminSettings } from '@/lib/settings/defaults';

type SettingsCache = {
  value: AdminSettings | null;
  loadedAt: number;
};

const TTL_MS = 60_000;
let cache: SettingsCache = { value: null, loadedAt: 0 };
let inFlight: Promise<AdminSettings> | null = null;

function shouldUseCache() {
  return cache.value && Date.now() - cache.loadedAt < TTL_MS;
}

async function fetchSettings(force = false): Promise<AdminSettings> {
  if (!force && shouldUseCache()) {
    return cache.value as AdminSettings;
  }
  if (!force && inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Settings request failed (${res.status})`);
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!data) throw new Error('Invalid settings response');
    const normalized = normalizeAdminSettings(data);
    cache = { value: normalized, loadedAt: Date.now() };
    return normalized;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function invalidateSettingsCache() {
  cache = { value: null, loadedAt: 0 };
}

export function useSettings() {
  const [settings, setSettings] = useState<AdminSettings>(cache.value ?? DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cache.value);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSettings(force);
      setSettings(next);
      return next;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load settings';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cache.value) return;
    void refresh();
  }, [refresh]);

  return { settings, loading, error, refresh };
}
