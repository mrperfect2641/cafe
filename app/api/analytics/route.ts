import { NextResponse } from 'next/server';
import { getAnalyticsForRange } from '@/lib/server/analytics/get-analytics';
import { resolveAnalyticsDateRange } from '@/lib/server/analytics/date-range';
import { requirePermission } from '@/lib/rbac/requirePermission';

export async function GET(req: Request) {
  const auth = await requirePermission('analytics:admin');
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const range = resolveAnalyticsDateRange(
    searchParams.get('fromDate'),
    searchParams.get('toDate'),
  );
  if (!range.ok) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const payload = await getAnalyticsForRange(range.from, range.to);
  return NextResponse.json(payload);
}
