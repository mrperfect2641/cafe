import { create } from 'zustand';

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type BillingCartState = {
  items: CartLine[];
  /** GST as percentage of subtotal (e.g. 5 = 5%) */
  gstPercent: number;
  /** Service charge as percentage of subtotal */
  serviceChargePercent: number;
  /** Fixed discount in currency units */
  discount: number;
  addProduct: (p: { productId: string; name: string; price: number }) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setGstPercent: (value: number) => void;
  setServiceChargePercent: (value: number) => void;
  setDiscount: (value: number) => void;
};

export function computeSubtotal(items: CartLine[]): number {
  return items.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function computeGstAmount(subtotal: number, gstPercent: number): number {
  if (gstPercent <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * (gstPercent / 100) * 100) / 100;
}

export function computeTotal(subtotal: number, gstAmount: number, discount: number): number {
  const d = Math.max(0, discount);
  return Math.max(0, Math.round((subtotal + gstAmount - d) * 100) / 100);
}

export const useBillingCartStore = create<BillingCartState>((set) => ({
  items: [],
  gstPercent: 5,
  serviceChargePercent: 0,
  discount: 0,

  addProduct: ({ productId, name, price }) => {
    set((state) => {
      const idx = state.items.findIndex((i) => i.productId === productId);
      if (idx >= 0) {
        const next = [...state.items];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return { items: next };
      }
      return {
        items: [...state.items, { productId, name, price, quantity: 1 }],
      };
    });
  },

  increment: (productId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    }));
  },

  decrement: (productId) => {
    set((state) => {
      const next = state.items
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      return { items: next };
    });
  },

  remove: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  clear: () => set({ items: [], discount: 0 }),

  setGstPercent: (value) => {
    const n = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    set({ gstPercent: n });
  },

  setServiceChargePercent: (value) => {
    const n = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    set({ serviceChargePercent: n });
  },

  setDiscount: (value) => {
    const n = Number.isFinite(value) ? Math.max(0, value) : 0;
    set({ discount: n });
  },
}));

/** Selector helpers for use outside React / tests */
export function getBillingTotals(
  state: Pick<BillingCartState, 'items' | 'gstPercent' | 'serviceChargePercent' | 'discount'>,
) {
  const subtotal = computeSubtotal(state.items);
  const gstAmount = computeGstAmount(subtotal, state.gstPercent);
  const serviceChargeAmount = computeGstAmount(subtotal, state.serviceChargePercent);
  const taxAmount = Math.round((gstAmount + serviceChargeAmount) * 100) / 100;
  const total = computeTotal(subtotal, taxAmount, state.discount);
  return { subtotal, gstAmount, serviceChargeAmount, taxAmount, total };
}
