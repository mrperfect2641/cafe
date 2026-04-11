'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatMoneyAmount } from '@/lib/format-money';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/types/menu';

type PosProductCardProps = {
  product: ProductDTO;
  onAdd: (product: ProductDTO) => void;
  disabled?: boolean;
};

export const PosProductCard = memo(function PosProductCard({
  product,
  onAdd,
  disabled,
}: PosProductCardProps) {
  const handleClick = useCallback(() => {
    if (!product.isAvailable || disabled) return;
    onAdd(product);
  }, [product, onAdd, disabled]);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || !product.isAvailable}
      onClick={handleClick}
      className={cn(
        'flex w-full flex-col rounded-xl border border-white/10 bg-white/[0.06] p-4 text-left transition-all duration-200',
        'hover:border-[#ff9800]/50 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-[#ff9800]/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9800]',
        'active:scale-[0.98]',
        (!product.isAvailable || disabled) && 'cursor-not-allowed opacity-45 hover:border-white/10',
      )}
    >
      <span className="line-clamp-2 font-semibold leading-snug text-white">{product.name}</span>
      <span className="mt-2 text-lg font-bold text-emerald-400">
        {formatMoneyAmount(product.price)}
      </span>
      {!product.isAvailable ? (
        <span className="mt-1 text-xs text-zinc-500">Unavailable</span>
      ) : null}
    </motion.button>
  );
});
