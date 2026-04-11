'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoryDTO } from '@/types/menu';

type CategoryTabsProps = {
  categories: CategoryDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAdmin: boolean;
  onAddCategory: () => void;
  disabled?: boolean;
};

export function CategoryTabs({
  categories,
  selectedId,
  onSelect,
  isAdmin,
  onAddCategory,
  disabled,
}: CategoryTabsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:flex-1 sm:pb-0"
        role="tablist"
        aria-label="Menu categories"
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
                'shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                active
                  ? 'border-[#ff9800] bg-[#ff9800]/15 text-foreground shadow-sm ring-2 ring-[#ff9800]/30'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-[#ff9800]/50 hover:bg-muted hover:text-foreground',
                disabled && 'pointer-events-none opacity-50',
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
      {isAdmin ? (
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1 bg-[#ff9800] font-semibold text-black hover:bg-[#ff5722]"
          onClick={onAddCategory}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      ) : null}
    </div>
  );
}
