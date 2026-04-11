import { ReportsDashboard } from '@/components/reports/reports-dashboard';

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue, orders, and product performance from saved checkouts.
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
