'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openPrintableInvoice, type InvoicePrintPayload } from '@/lib/print-invoice';

type PrintBillProps = {
  buildPayload: () => InvoicePrintPayload;
  disabled?: boolean;
};

export function PrintBill({ buildPayload, disabled }: PrintBillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      disabled={disabled}
      onClick={() => openPrintableInvoice(buildPayload())}
    >
      <Printer className="h-4 w-4" />
      Print bill
    </Button>
  );
}
