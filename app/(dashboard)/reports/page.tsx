import { ReportsDashboard } from '@/components/reports/reports-dashboard';

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Growth intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actionable sales, menu, staffing, and timing insights from saved checkouts — pick a range and
          decide faster.
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
