// src/core/repositories/ProductRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../domain/types';
import { AVAILABLE_PRODUCTS } from '../data/mocks';
import { eventRepository } from './EventRepository'; // Import event repository

// Rename for semantic clarity
let MOCK_PRODUCTS: Product[] = AVAILABLE_PRODUCTS;

// The repository interface defines the contract for data operations.
export interface IProductRepository {
  getAll(): Promise<Product[]>;
  add(productData: Omit<Product, 'id'>): Promise<Product>;
  update(updatedProduct: Product): Promise<Product>;
  remove(productId: string): Promise<void>;
}

/**
 * A mock implementation of the product repository that operates on an in-memory array.
 */
class MockProductRepository implements IProductRepository {
  private static instance: MockProductRepository;

  private constructor() {}

  public static getInstance(): MockProductRepository {
    if (!MockProductRepository.instance) {
      MockProductRepository.instance = new MockProductRepository();
    }
    return MockProductRepository.instance;
  }

  async getAll(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
    // Return only non-archived products
    return MOCK_PRODUCTS.filter(p => !p.isArchived);
  }

  async add(productData: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = { id: uuidv4(), ...productData };
    MOCK_PRODUCTS.push(newProduct);
    await new Promise(resolve => setTimeout(resolve, 300));
    return newProduct;
  }

  async update(updatedProduct: Product): Promise<Product> {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === updatedProduct.id);
    if (index === -1) {
      throw new Error("Product not found");
    }
    MOCK_PRODUCTS[index] = updatedProduct;
    await new Promise(resolve => setTimeout(resolve, 300));
    return updatedProduct;
  }

  async remove(productId: string): Promise<void> {
    // Check if the product is used in any event
    const allEvents = await eventRepository.getAllEvents(); // Assuming getAllEvents exists
    const isProductInUse = allEvents.some(event => event.products.some(p => p.id === productId));

    if (isProductInUse) {
      // If in use, archive it (soft delete)
      const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        MOCK_PRODUCTS[productIndex].isArchived = true;
      }
    } else {
      // If not in use, delete it permanently (hard delete)
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter(p => p.id !== productId);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Export a singleton instance of the mock repository.
export const productRepository = MockProductRepository.getInstance();
