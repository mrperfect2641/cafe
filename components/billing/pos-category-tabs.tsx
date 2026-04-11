'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryDTO } from '@/types/menu';

type PosCategoryTabsProps = {
  categories: CategoryDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

/** Read-only category bar for POS (no add/edit/delete). */
export const PosCategoryTabs = memo(function PosCategoryTabs({
  categories,
  selectedId,
  onSelect,
  disabled,
}: PosCategoryTabsProps) {
  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
      role="tablist"
      aria-label="Categories"
    >
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
              active
                ? 'border-[#ff9800] bg-[#ff9800]/20 text-white shadow-md ring-2 ring-[#ff9800]/40'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:border-[#ff9800]/40 hover:bg-white/10 hover:text-white',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
});
