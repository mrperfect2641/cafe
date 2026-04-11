'use client';

import { motion } from 'framer-motion';
import { Coffee, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoneyAmount } from '@/lib/format-money';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/types/menu';

type ProductCardProps = {
  product: ProductDTO;
  canManageMenu: boolean;
  onDelete: (p: ProductDTO) => void;
  disabled?: boolean;
};

export function ProductCard({ product, canManageMenu, onDelete, disabled }: ProductCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:border-[#ff9800]/40 hover:shadow-md',
        !product.isAvailable && 'opacity-60',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-[#ff9800]/15 group-hover:text-[#ff9800]">
            <Coffee className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">{product.name}</h3>
            {!product.isAvailable ? (
              <span className="text-xs text-muted-foreground">Unavailable</span>
            ) : null}
          </div>
        </div>
        {canManageMenu ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${product.name}`}
            disabled={disabled}
            onClick={() => onDelete(product)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <p className="mt-auto text-lg font-semibold text-emerald-600 dark:text-emerald-400">
        {formatMoneyAmount(product.price)}
      </p>
    </motion.div>
  );
}
