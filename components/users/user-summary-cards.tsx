'use client';

type UserSummaryCardsProps = {
  totalUsers: number;
  staffCount: number;
  managerCount: number;
  inactiveCount: number;
};

export function UserSummaryCards({
  totalUsers,
  staffCount,
  managerCount,
  inactiveCount,
}: Readonly<UserSummaryCardsProps>) {
  const cards = [
    { label: 'Total users', value: String(totalUsers) },
    { label: 'Staff', value: String(staffCount) },
    { label: 'Managers', value: String(managerCount) },
    { label: 'Inactive users', value: String(inactiveCount) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
