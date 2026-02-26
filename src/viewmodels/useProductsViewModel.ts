// src/viewmodels/useProductsViewModel.ts
import { useState, useEffect } from 'react';
import type { Product } from '../core/domain/types';
import { productRepository } from '../core/repositories/ProductRepository';

export const useProductsViewModel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    productRepository.getAll().then(() => setIsLoading(false));

    const unsubscribe = productRepository.subscribe((data) => {
      setProducts(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

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

    try {
      if (editingProduct.id) {
        // Update existing product
        await productRepository.update(editingProduct as Product);
      } else {
        // Add new product
        await productRepository.add(editingProduct as Omit<Product, 'id'>);
      }

      closeModal();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao salvar produto.' };
    }
  };

  const confirmDeleteExternal = async (productId: string) => {
    try {
      await productRepository.remove(productId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir produto.' };
    }
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
    confirmDeleteExternal,
    updateEditingProduct,
  };
};
