'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoneyAmount } from '@/lib/format-money';

type BillingSummaryProps = {
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  discount: number;
  discountMode: 'amount' | 'percent';
  discountPercent: number;
  total: number;
  onGstPercentChange: (value: number) => void;
  onServiceChargePercentChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  onDiscountModeChange: (mode: 'amount' | 'percent') => void;
  onDiscountPercentChange: (value: number) => void;
  discountsEnabled?: boolean;
  disabled?: boolean;
};

export const BillingSummary = memo(function BillingSummary({
  subtotal,
  gstPercent,
  gstAmount,
  serviceChargePercent,
  serviceChargeAmount,
  discount,
  discountMode,
  discountPercent,
  total,
  onGstPercentChange,
  onServiceChargePercentChange,
  onDiscountChange,
  onDiscountModeChange,
  onDiscountPercentChange,
  discountsEnabled = true,
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
        <Label htmlFor="service-charge-pct" className="text-zinc-400">
          Service charge (%)
        </Label>
        <Input
          id="service-charge-pct"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.5}
          value={serviceChargePercent || ''}
          onChange={(e) => onServiceChargePercentChange(Number.parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className="border-white/15 bg-white/5 text-white"
        />
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Service charge amount</span>
          <span className="tabular-nums text-zinc-300">{formatMoneyAmount(serviceChargeAmount)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount" className="text-zinc-400">
          Discount
        </Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDiscountModeChange('amount')}
            disabled={disabled || !discountsEnabled}
            className={
              discountMode === 'amount'
                ? 'rounded-lg border border-[#ff9800]/60 bg-[#ff9800]/15 px-3 py-1.5 text-xs font-semibold text-white'
                : 'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10'
            }
          >
            ₹ Amount
          </button>
          <button
            type="button"
            onClick={() => onDiscountModeChange('percent')}
            disabled={disabled || !discountsEnabled}
            className={
              discountMode === 'percent'
                ? 'rounded-lg border border-[#ff9800]/60 bg-[#ff9800]/15 px-3 py-1.5 text-xs font-semibold text-white'
                : 'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10'
            }
          >
            % Percent
          </button>
        </div>

        {discountMode === 'amount' ? (
          <Input
            id="discount"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={discount || ''}
            onChange={(e) => onDiscountChange(Number.parseFloat(e.target.value) || 0)}
            disabled={disabled || !discountsEnabled}
            className="border-white/15 bg-white/5 text-white"
          />
        ) : (
          <Input
            id="discount"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.5}
            value={discountPercent || ''}
            onChange={(e) => onDiscountPercentChange(Number.parseFloat(e.target.value) || 0)}
            disabled={disabled || !discountsEnabled}
            className="border-white/15 bg-white/5 text-white"
          />
        )}
        {discountMode === 'percent' ? (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Discount amount</span>
            <span className="tabular-nums text-zinc-300">{formatMoneyAmount(discount)}</span>
          </div>
        ) : null}
        {!discountsEnabled ? (
          <p className="text-xs text-zinc-500">Discounts are disabled in business settings.</p>
        ) : null}
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
