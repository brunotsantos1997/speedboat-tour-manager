// src/core/data/mocks.ts
import { v4 as uuidv4 } from 'uuid';
import type { Product, ClientProfile, LoyaltyRule } from '../domain/types';

/**
 * List of available products for selection. Renamed from Combos.
 */
export const AVAILABLE_PRODUCTS: Product[] = [
  {
    id: uuidv4(),
    name: 'Aluguel Lancha (4h)',
    price: 2500,
    pricingType: 'FIXED',
    iconKey: 'Anchor',
    isDefaultCourtesy: false,
  },
  {
    id: uuidv4(),
    name: 'Kit Churrasco',
    price: 100, // Price per person
    pricingType: 'PER_PERSON',
    iconKey: 'Utensils',
    isDefaultCourtesy: false,
  },
  {
    id: uuidv4(),
    name: 'Bebidas',
    price: 50, // Price per person
    pricingType: 'PER_PERSON',
    iconKey: 'Beer',
    isDefaultCourtesy: false,
  },
  {
    id: uuidv4(),
    name: 'Serviço de Marinheiro',
    price: 300,
    pricingType: 'FIXED',
    iconKey: 'User',
    isDefaultCourtesy: true, // Example of default courtesy
  },
];

/**
 * Mock list of client profiles for loyalty checks.
 */
export const MOCK_CLIENTS: ClientProfile[] = [
  {
    id: uuidv4(),
    phone: '11987654321',
    name: 'Cliente Fiel',
    totalTrips: 4, // Next trip is the 5th
  },
  {
    id: uuidv4(),
    phone: '21912345678',
    name: 'Cliente Novo',
    totalTrips: 0,
  },
];

/**
 * Rules for the loyalty program.
 */
export const LOYALTY_RULES: LoyaltyRule[] = [
  {
    type: 'RECURRENCE',
    threshold: 5,
    message: 'Cliente na 5ª viagem! Sugerir cortesia ou desconto especial.',
  },
  {
    type: 'SPECIAL_DATE',
    date: new Date().toISOString().split('T')[0], // Today's date for testing
    message: 'Data especial! Sugerir um desconto sazonal.',
  },
];
