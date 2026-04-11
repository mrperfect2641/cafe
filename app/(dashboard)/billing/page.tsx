import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BillingPos } from '@/components/billing/billing-pos';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const cashierName = session?.user?.name ?? 'Staff';

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white">
      <BillingPos cashierName={cashierName} />
    </div>
  );
}
