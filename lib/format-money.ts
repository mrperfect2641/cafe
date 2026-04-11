/** Display helper; currency from env for flexibility (default INR). */
export function formatMoneyAmount(amount: string | number): string {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return String(amount);
  const code = process.env.NEXT_PUBLIC_CURRENCY_CODE ?? 'INR';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}
