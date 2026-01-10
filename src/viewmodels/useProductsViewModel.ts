// src/viewmodels/useProductsViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../core/domain/types';
import { productRepository } from '../core/repositories/ProductRepository';

export const useProductsViewModel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const fetchedProducts = await productRepository.getAll();
    setProducts(fetchedProducts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openNewProductModal = () => {
    setEditingProduct({
      name: '',
      price: 0,
      pricingType: 'FIXED',
      iconKey: 'Package',
      isDefaultCourtesy: false,
    });
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    if (editingProduct.id) {
      // Update existing product
      await productRepository.update(editingProduct as Product);
    } else {
      // Add new product
      await productRepository.add(editingProduct as Omit<Product, 'id'>);
    }

    closeModal();
    await fetchProducts(); // Refresh the list
  };

  const handleDelete = async (productId: string) => {
    // Optional: Add a confirmation dialog here in a real app
    await productRepository.remove(productId);
    await fetchProducts(); // Refresh the list
  };

  const updateEditingProduct = (field: keyof Product, value: any) => {
    setEditingProduct(prev => prev ? { ...prev, [field]: value } : null);
  };

  return {
    products,
    isLoading,
    isModalOpen,
    editingProduct,
    openNewProductModal,
    openEditProductModal,
    closeModal,
    handleSave,
    handleDelete,
    updateEditingProduct,
  };
};
