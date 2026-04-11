'use client';

import { memo, useCallback } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoneyAmount } from '@/lib/format-money';
import type { CartLine } from '@/store/billing-cart-store';

type CartItemProps = {
  line: CartLine;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  disabled?: boolean;
};

export const CartItem = memo(function CartItem({
  line,
  onIncrement,
  onDecrement,
  onRemove,
  disabled,
}: CartItemProps) {
  const inc = useCallback(() => onIncrement(line.productId), [line.productId, onIncrement]);
  const dec = useCallback(() => onDecrement(line.productId), [line.productId, onDecrement]);
  const rm = useCallback(() => onRemove(line.productId), [line.productId, onRemove]);

  const lineTotal = line.price * line.quantity;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{line.name}</p>
        <p className="text-xs text-zinc-400">
          {formatMoneyAmount(line.price)} × {line.quantity} ={' '}
          <span className="font-semibold text-emerald-400">{formatMoneyAmount(lineTotal)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/10"
          onClick={dec}
          disabled={disabled}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-white">
          {line.quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/10"
          onClick={inc}
          disabled={disabled}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
          onClick={rm}
          disabled={disabled}
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
