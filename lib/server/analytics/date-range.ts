/** Parse `YYYY-MM-DD` as local midnight. */
export function parseYmdToLocalStart(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function parseYmdToLocalEnd(ymd: string): Date | null {
  const start = parseYmdToLocalStart(ymd);
  if (!start) return null;
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return end;
}

function localStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function localEndOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export type DateRangeResult =
  | { ok: true; from: Date; to: Date }
  | { ok: false; error: string };

/**
 * Analytics window: default is the current local calendar day.
 * If only `fromDate` is set, range runs through end of today.
 */
export function resolveAnalyticsDateRange(
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
): DateRangeResult {
  const fromTrim = fromRaw?.trim() || '';
  const toTrim = toRaw?.trim() || '';

  if (!fromTrim && !toTrim) {
    return { ok: true, from: localStartOfToday(), to: localEndOfToday() };
  }

  if (fromTrim && !toTrim) {
    const from = parseYmdToLocalStart(fromTrim);
    if (!from) return { ok: false, error: 'Invalid fromDate (use YYYY-MM-DD)' };
    return { ok: true, from, to: localEndOfToday() };
  }

  if (!fromTrim && toTrim) {
    const to = parseYmdToLocalEnd(toTrim);
    if (!to) return { ok: false, error: 'Invalid toDate (use YYYY-MM-DD)' };
    const from = parseYmdToLocalStart(toTrim);
    if (!from) return { ok: false, error: 'Invalid toDate (use YYYY-MM-DD)' };
    return { ok: true, from, to };
  }

  const from = parseYmdToLocalStart(fromTrim);
  const to = parseYmdToLocalEnd(toTrim);
  if (!from) return { ok: false, error: 'Invalid fromDate (use YYYY-MM-DD)' };
  if (!to) return { ok: false, error: 'Invalid toDate (use YYYY-MM-DD)' };
  if (from.getTime() > to.getTime()) {
    return { ok: false, error: 'fromDate must be on or before toDate' };
  }
  return { ok: true, from, to };
}

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
