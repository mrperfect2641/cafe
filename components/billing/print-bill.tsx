'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openPrintableInvoice, type InvoicePrintPayload } from '@/lib/print-invoice';

type PrintBillProps = {
  buildPayload: () => InvoicePrintPayload;
  printAreaId?: string;
  disabled?: boolean;
};

function printHtmlFromElement(elementId: string): boolean {
  const el = document.getElementById(elementId);
  if (!el) return false;

  const w = window.open('', '_blank', 'width=600,height=720');
  if (!w) return false;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; max-width: 520px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    .muted { color: #444; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; }
    .num { text-align: right; }
    .summary { margin-top: 16px; font-size: 0.9rem; }
    .summary div { display: flex; justify-content: space-between; margin: 4px 0; }
    .total { font-weight: 700; font-size: 1.1rem; margin-top: 8px; padding-top: 8px; border-top: 2px solid #111; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  ${el.innerHTML}
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

export function PrintBill({ buildPayload, printAreaId = 'print-area', disabled }: PrintBillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      disabled={disabled}
      onClick={() => {
        const printed = printHtmlFromElement(printAreaId);
        if (!printed) openPrintableInvoice(buildPayload());
      }}
    >
      <Printer className="h-4 w-4" />
      Print bill
    </Button>
  );
}
