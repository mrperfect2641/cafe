'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryDTO, ProductDTO } from '@/types/menu';

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
  defaultCategoryId: string | null;
  onCreated: (product: ProductDTO) => void;
};

export function AddProductModal({
  open,
  onClose,
  categories,
  defaultCategoryId,
  onCreated,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoryId((prev) => {
      if (prev && categories.some((c) => c.id === prev)) return prev;
      if (defaultCategoryId && categories.some((c) => c.id === defaultCategoryId)) {
        return defaultCategoryId;
      }
      return categories[0]?.id ?? '';
    });
  }, [open, defaultCategoryId, categories]);

  function reset() {
    setName('');
    setPrice('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const num = Number.parseFloat(price);
    if (!trimmedName) {
      toast.error('Enter item name');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (!categoryId) {
      toast.error('Select a category');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, price: num, categoryId }),
      });
      const json = (await res.json().catch(() => null)) as ProductDTO | { error?: string } | null;
      if (!res.ok) {
        toast.error(
          typeof json === 'object' && json && 'error' in json ? String(json.error) : 'Failed',
        );
        return;
      }
      if (json && 'id' in json) {
        onCreated(json as ProductDTO);
        toast.success('Item added');
        reset();
        onClose();
      }
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add item" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prod-name">Name</Label>
          <Input
            id="prod-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            disabled={submitting}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-price">Price</Label>
          <Input
            id="prod-price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-category">Category</Label>
          <select
            id="prod-category"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting || categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">No categories</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || categories.length === 0}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
