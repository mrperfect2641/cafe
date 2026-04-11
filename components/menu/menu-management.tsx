'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ProductCard } from '@/components/menu/product-card';
import { AddCategoryModal } from '@/components/menu/add-category-modal';
import { AddProductModal } from '@/components/menu/add-product-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { CategoryDTO, ProductDTO } from '@/types/menu';

type MenuManagementProps = {
  isAdmin: boolean;
};

function CategoryBarSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-10 w-28 shrink-0 animate-pulse rounded-lg bg-muted"
          style={{ animationDelay: `${i * 75}ms` }}
        />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-xl border border-border bg-muted/50"
          style={{ animationDelay: `${(i % 4) * 50}ms` }}
        />
      ))}
    </div>
  );
}

export function MenuManagement({ isAdmin }: MenuManagementProps) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDTO[]>([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductDTO | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [mutationBusy, setMutationBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setCategoriesError(j?.error ?? 'Failed to load categories');
        setCategories([]);
        return;
      }
      const data = (await res.json()) as CategoryDTO[];
      setCategories(data);
      setSelectedCategoryId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch {
      setCategoriesError('Network error');
      setCategories([]);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (categoryId: string) => {
    setProductsLoading(true);
    try {
      const res = await fetch(`/api/products?categoryId=${encodeURIComponent(categoryId)}`);
      if (!res.ok) {
        setProducts([]);
        toast.error('Failed to load items');
        return;
      }
      const data = (await res.json()) as ProductDTO[];
      setProducts(data);
    } catch {
      setProducts([]);
      toast.error('Failed to load items');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      return;
    }
    void loadProducts(selectedCategoryId);
  }, [selectedCategoryId, loadProducts]);

  function handleCategoryCreated(cat: CategoryDTO) {
    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedCategoryId(cat.id);
  }

  function handleProductCreated(product: ProductDTO) {
    if (product.categoryId === selectedCategoryId) {
      setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  function openDelete(p: ProductDTO) {
    setDeleteTarget(p);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleteSubmitting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setMutationBusy(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(j?.error ?? 'Delete failed');
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success('Item removed');
      closeDeleteModal();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteSubmitting(false);
      setMutationBusy(false);
    }
  }

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? '';

  return (
    <div className="space-y-6">
      {categoriesLoading ? (
        <CategoryBarSkeleton />
      ) : categoriesError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {categoriesError}{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => void loadCategories()}
          >
            Retry
          </button>
        </div>
      ) : (
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          isAdmin={isAdmin}
          onAddCategory={() => setAddCategoryOpen(true)}
          disabled={mutationBusy}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {selectedCategoryId ? selectedCategoryName : 'Items'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedCategoryId
              ? `${products.length} item${products.length === 1 ? '' : 's'}`
              : 'Select a category'}
          </p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            size="sm"
            className="gap-1 bg-[#ff9800] font-semibold text-black hover:bg-[#ff5722]"
            onClick={() => setAddProductOpen(true)}
            disabled={categories.length === 0 || mutationBusy}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        ) : null}
      </div>

      {!selectedCategoryId && !categoriesLoading && categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">No categories yet.</p>
          {isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setAddCategoryOpen(true)}
            >
              Add your first category
            </Button>
          ) : null}
        </div>
      ) : productsLoading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center transition-colors">
          <p className="text-muted-foreground">No items in this category.</p>
          {isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setAddProductOpen(true)}
              disabled={categories.length === 0}
            >
              Add an item
            </Button>
          ) : null}
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isAdmin={isAdmin}
                onDelete={openDelete}
                disabled={mutationBusy}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AddCategoryModal
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onCreated={handleCategoryCreated}
      />

      <AddProductModal
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
        onCreated={handleProductCreated}
      />

      <Modal open={deleteOpen} onClose={closeDeleteModal} title="Delete item">
        <p className="text-sm text-muted-foreground">Delete this item?</p>
        {deleteTarget ? <p className="mt-2 font-medium">{deleteTarget.name}</p> : null}
        <p className="mt-2 text-xs text-destructive">This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeDeleteModal}
            disabled={deleteSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmDelete()}
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
