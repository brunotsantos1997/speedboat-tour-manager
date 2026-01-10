// src/core/domain/types.ts
import { Icon } from 'lucide-react';

/**
 * Represents a selectable service or product combo.
 */
export interface Combo {
  id: string;
  name: string;
  price: number;
  iconKey: string; // Simplified for robust bundling
}

/**
 * Represents the discount applied to an event.
 */
export interface Discount {
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
}

/**
 * Represents a selected combo in an event, with its courtesy status.
 */
export interface SelectedCombo extends Combo {
  isCourtesy: boolean;
}

/**
 * Represents the main event being created.
 */
export interface Event {
  id: string;
  combos: SelectedCombo[];
  discount: Discount;
  clientPhone: string;
  subtotal: number;
  total: number;
}

/**
 * Represents a client's profile for loyalty checks.
 */
export interface ClientProfile {
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
