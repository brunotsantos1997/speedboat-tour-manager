// src/core/data/mocks.ts
import { v4 as uuidv4 } from 'uuid';
import type { Combo, ClientProfile, LoyaltyRule } from '../domain/types';

/**
 * List of available combos for selection.
 */
export const AVAILABLE_COMBOS: Combo[] = [
  {
    id: uuidv4(),
    name: 'Aluguel Lancha (4h)',
    price: 2500,
    iconKey: 'Anchor',
  },
  {
    id: uuidv4(),
    name: 'Kit Churrasco',
    price: 500,
    iconKey: 'Utensils',
  },
  {
    id: uuidv4(),
    name: 'Bebidas',
    price: 200,
    iconKey: 'Beer',
  },
  {
    id: uuidv4(),
    name: 'Serviço de Marinheiro',
    price: 300,
    iconKey: 'User',
  },
  {
    id: uuidv4(),
    name: 'Boia Recreativa',
    price: 150,
    iconKey: 'Circle',
  },
];

/**
 * Mock list of client profiles for loyalty checks.
 */
export const MOCK_CLIENTS: ClientProfile[] = [
  {
    phone: '11987654321',
    name: 'Cliente Fiel',
    totalTrips: 4, // Next trip is the 5th
  },
  {
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
