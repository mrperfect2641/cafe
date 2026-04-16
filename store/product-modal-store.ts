import { create } from 'zustand';

type ProductModalState = {
  productId: string | null;
  isOpen: boolean;
  openProductModal: (productId: string) => void;
  closeProductModal: () => void;
};

export const useProductModalStore = create<ProductModalState>((set) => ({
  productId: null,
  isOpen: false,
  openProductModal: (productId) => {
    const nextId = productId.trim();
    if (!nextId) return;
    set({ productId: nextId, isOpen: true });
  },
  closeProductModal: () => set({ isOpen: false, productId: null }),
}));
