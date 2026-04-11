import { OrdersList } from '@/components/orders/orders-list';

export default function OrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders saved from Billing (confirm checkout) appear here.
        </p>
      </div>
      <OrdersList />
    </div>
  );
}
