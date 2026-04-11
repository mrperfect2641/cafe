import type { CartLine } from '@/store/billing-cart-store';

export type InvoicePrintPayload = {
  customerName: string;
  tableNo: string;
  lines: CartLine[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  discount: number;
  total: number;
  issuedAt: Date;
};

export function openPrintableInvoice(payload: InvoicePrintPayload): void {
  const {
    customerName,
    tableNo,
    lines,
    subtotal,
    gstPercent,
    gstAmount,
    discount,
    total,
    issuedAt,
  } = payload;

  const rows = lines
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.name)}</td>
        <td class="num">${l.quantity}</td>
        <td class="num">${l.price.toFixed(2)}</td>
        <td class="num">${(l.price * l.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    .meta { font-size: 0.875rem; color: #444; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
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
  <h1>Smart Cafe</h1>
  <div class="meta">
    <div>${escapeHtml(issuedAt.toLocaleString())}</div>
    ${customerName ? `<div>Customer: ${escapeHtml(customerName)}</div>` : ''}
    ${tableNo ? `<div>Table: ${escapeHtml(tableNo)}</div>` : ''}
  </div>
  <table>
    <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Line</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
    <div><span>GST (${gstPercent}%)</span><span>${gstAmount.toFixed(2)}</span></div>
    <div><span>Discount</span><span>${discount.toFixed(2)}</span></div>
    <div class="total"><span>Total</span><span>${total.toFixed(2)}</span></div>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=600,height=720');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
