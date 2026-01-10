// src/core/domain/types.ts

/**
 * Represents a configurable product or service.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  pricingType: 'FIXED' | 'PER_PERSON';
  iconKey: string;
  isDefaultCourtesy: boolean;
}

/**
 * Represents the discount applied to an event.
 */
export interface Discount {
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
}

/**
 * Represents a selected product in an event, with its courtesy status.
 */
export interface SelectedProduct extends Product {
  isCourtesy: boolean;
}

/**
 * Represents the main event being created.
 */
export interface Event {
  id: string;
  products: SelectedProduct[];
  discount: Discount;
  client: ClientProfile | null;
  passengerCount: number;
  subtotal: number;
  total: number;
}

/**
 * Represents a client's profile for loyalty checks.
 */
export interface ClientProfile {
  id: string;
  phone: string;
  name: string;
  totalTrips: number;
}

/**
 * Represents the loyalty program rules.
 */
export interface LoyaltyRule {
  type: 'RECURRENCE' | 'SPECIAL_DATE';
  threshold?: number; // e.g., 5 trips
  date?: string; // e.g., '2024-12-25'
  message: string;
}
