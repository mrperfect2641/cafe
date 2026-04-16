import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/rbac/requirePermission';
import { requireAuthSession } from '@/lib/require-auth-api';
import { getSettingsObject, updateSettings, type SettingsMap } from '@/lib/server/settings/store';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonCompatible(value: unknown): boolean {
  if (value === null) return true;

  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (t === 'undefined' || t === 'bigint' || t === 'function' || t === 'symbol') return false;

  if (Array.isArray(value)) {
    return value.every((v) => isJsonCompatible(v));
  }

  if (!isPlainObject(value)) return false;
  return Object.values(value).every((v) => isJsonCompatible(v));
}

function normalizeIncomingSettings(payload: unknown): SettingsMap | null {
  if (!isPlainObject(payload)) return null;

  const raw = isPlainObject(payload.settings) ? payload.settings : payload;
  const entries = Object.entries(raw);
  if (entries.length === 0) return null;

  const normalized: SettingsMap = {};
  for (const [key, value] of entries) {
    const cleanKey = key.trim();
    if (!cleanKey || cleanKey.length > 100 || !/^[a-zA-Z0-9_]+$/.test(cleanKey)) {
      return null;
    }
    if (!isJsonCompatible(value)) {
      return null;
    }
    normalized[cleanKey] = value;
  }

  return normalized;
}

export async function GET() {
  const auth = await requireAuthSession();
  if (!auth.ok) return auth.response;

  const settings = await getSettingsObject();
  return NextResponse.json(settings);
}

async function updateFromRequest(req: Request) {
  const auth = await requirePermission('settings:manage');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const values = normalizeIncomingSettings(body);
  if (!values) {
    return NextResponse.json(
      {
        error:
          'Invalid settings payload. Send a non-empty object with keys using letters/numbers/underscore and JSON-compatible values.',
      },
      { status: 400 },
    );
  }

  const updated = await updateSettings(values);
  return NextResponse.json(updated);
}

export async function POST(req: Request) {
  return updateFromRequest(req);
}

export async function PATCH(req: Request) {
  return updateFromRequest(req);
}
