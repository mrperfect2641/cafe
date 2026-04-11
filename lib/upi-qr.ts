/**
 * UPI deep link for QR scanners. Payee VPA from NEXT_PUBLIC_UPI_VPA.
 */
export function buildUpiPayUri(amount: number, note?: string): string | null {
  const pa = process.env.NEXT_PUBLIC_UPI_VPA?.trim();
  if (!pa) return null;
  const pn = (process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? 'Cafe').trim();
  const am = Math.max(0, amount).toFixed(2);
  const params = new URLSearchParams({
    pa,
    pn,
    am,
    cu: 'INR',
  });
  if (note) params.set('tn', note.slice(0, 80));
  return `upi://pay?${params.toString()}`;
}
