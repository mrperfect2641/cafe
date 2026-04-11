'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryDTO } from '@/types/menu';

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (category: CategoryDTO) => void;
};

export function AddCategoryModal({ open, onClose, onCreated }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Enter a category name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as CategoryDTO | { error?: string } | null;
      if (!res.ok) {
        toast.error(
          typeof json === 'object' && json && 'error' in json ? String(json.error) : 'Failed',
        );
        return;
      }
      if (json && 'id' in json) {
        onCreated(json as CategoryDTO);
        toast.success('Category added');
        reset();
        onClose();
      }
    } catch {
      toast.error('Failed to add category');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add category" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cat-name">Category name</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Specialty Drinks"
            disabled={submitting}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
