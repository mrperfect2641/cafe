'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoneyAmount } from '@/lib/format-money';

type BillingSummaryProps = {
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  discount: number;
  total: number;
  onGstPercentChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  disabled?: boolean;
};

export const BillingSummary = memo(function BillingSummary({
  subtotal,
  gstPercent,
  gstAmount,
  discount,
  total,
  onGstPercentChange,
  onDiscountChange,
  disabled,
}: BillingSummaryProps) {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Subtotal</span>
        <span className="font-medium tabular-nums text-white">{formatMoneyAmount(subtotal)}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gst-pct" className="text-zinc-400">
          GST (%)
        </Label>
        <Input
          id="gst-pct"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.5}
          value={gstPercent || ''}
          onChange={(e) => onGstPercentChange(Number.parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className="border-white/15 bg-white/5 text-white"
        />
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">GST amount</span>
          <span className="tabular-nums text-zinc-300">{formatMoneyAmount(gstAmount)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount" className="text-zinc-400">
          Discount (fixed amount)
        </Label>
        <Input
          id="discount"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={discount || ''}
          onChange={(e) => onDiscountChange(Number.parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className="border-white/15 bg-white/5 text-white"
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/15 pt-4">
        <span className="text-base font-semibold text-white">Total</span>
        <span className="text-xl font-bold tabular-nums text-[#ff9800]">
          {formatMoneyAmount(total)}
        </span>
      </div>
    </div>
  );
});
