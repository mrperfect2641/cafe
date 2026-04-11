export type CategoryDTO = {
  id: string;
  name: string;
  createdAt: string;
};

export type ProductDTO = {
  id: string;
  name: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  createdAt: string;
};
