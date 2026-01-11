// src/core/domain/types.ts

/**
 * Represents a configurable product or service.
 */
export interface Product {
  id: string;
  name: string;
  price?: number; // Price for FIXED or PER_PERSON
  hourlyPrice?: number; // Price for HOURLY
  pricingType: 'FIXED' | 'PER_PERSON' | 'HOURLY';
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
  startTime?: string; // e.g., "15:00"
  endTime?: string;   // e.g., "19:00"
}

/**
 * Represents a boat available for rental.
 */
export interface Boat {
  id: string;
  name: string;
  capacity: number;
  size: number; // in feet
}

export type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/**
 * Represents the main event being created.
 */
export interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: EventStatus;
  boat: Boat;
  products: SelectedProduct[];
  discount: Discount;
  client: ClientProfile;
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
