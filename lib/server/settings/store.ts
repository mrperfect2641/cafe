import { prisma } from '@/lib/prisma';

export type SettingsMap = Record<string, unknown>;

function shouldAttemptJsonParse(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
    return true;
  }

  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') {
    return true;
  }

  return /^-?\d+(\.\d+)?$/.test(trimmed);
}

export function parseStoredSettingValue(value: string): unknown {
  if (!shouldAttemptJsonParse(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function serializeSettingValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

export async function getSettingsObject(): Promise<SettingsMap> {
  const rows = await prisma.settings.findMany({
    select: { key: true, value: true },
    orderBy: { key: 'asc' },
  });

  const settings: SettingsMap = {};
  for (const row of rows) {
    settings[row.key] = parseStoredSettingValue(row.value);
  }

  return settings;
}

export async function updateSettings(values: SettingsMap): Promise<SettingsMap> {
  const entries = Object.entries(values);
  if (entries.length === 0) return getSettingsObject();

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        create: {
          key,
          value: serializeSettingValue(value),
        },
        update: {
          value: serializeSettingValue(value),
        },
      }),
    ),
  );

  return getSettingsObject();
}
