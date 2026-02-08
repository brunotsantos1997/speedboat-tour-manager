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
  isArchived?: boolean;
}

/**
 * Represents a miscellaneous income (gain).
 */
export interface Income {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  timestamp: number;
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
  discount?: Discount;
}

/**
 * Represents a boat available for rental.
 */
export interface Boat {
  id: string;
  name: string;
  capacity: number;
  size: number; // in feet
  pricePerHour: number;
  pricePerHalfHour: number;
  organizationTimeMinutes: number;
  isArchived?: boolean;
}

/**
 * Represents a boarding location.
 */
export interface BoardingLocation {
  id: string;
  name: string;
  mapLink?: string;
  isArchived?: boolean;
}

/**
 * Represents a type of tour (e.g., Anniversary, Bachelor Party).
 */
export interface TourType {
  id: string;
  name: string;
  color: string;
  isArchived?: boolean;
}

export type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PRE_SCHEDULED' | 'PENDING_REFUND' | 'REFUNDED' | 'ARCHIVED_COMPLETED' | 'ARCHIVED_CANCELLED';
export type PaymentStatus = 'PENDING' | 'CONFIRMED';
export type PaymentMethod = 'PIX' | 'CARD_CREDIT' | 'CARD_DEBIT' | 'CASH' | 'TRANSFER' | 'OTHER';
export type PaymentType = 'DOWN_PAYMENT' | 'BALANCE' | 'FULL';

/**
 * Represents a payment for an event.
 */
export interface Payment {
  id: string;
  eventId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

/**
 * Represents the main event being created.
 */
export interface EventType {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: EventStatus;
  paymentStatus?: PaymentStatus;
  preScheduledAt?: number; // Timestamp for pre-booking expiration
  boat: Boat;
  boardingLocation: BoardingLocation;
  tourType?: TourType;
  products: SelectedProduct[];
  rentalDiscount?: Discount;
  productsDiscount?: Discount; // Legacy
  discount?: Discount; // Legacy
  client: ClientProfile;
  passengerCount: number;
  subtotal: number;
  total: number;
  tax?: number;
  taxDescription?: string;
  observations?: string;
  isAcknowledged?: boolean; // For dashboard notifications
  createdByUserId?: string;
  payments?: Payment[];
  rentalRevenue?: number;
  productsRevenue?: number;
  autoCancelled?: boolean;
}

/**
 * Represents a category for expenses.
 */
export interface ExpenseCategory {
  id: string;
  name: string;
  isArchived?: boolean;
}

/**
 * Represents an expense.
 */
export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  categoryId: string;
  categoryName?: string; // Denormalized for easier display
  boatId?: string; // Optional: linked to a specific boat
  boatName?: string;
  status: 'PENDING' | 'PAID';
  paymentMethod?: PaymentMethod;
  timestamp: number;
  isArchived?: boolean;
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

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface BusinessDayHours {
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export type BusinessHours = Record<DayOfWeek, BusinessDayHours>;

export interface CompanyData {
  id: string;
  cnpj: string;
  phone: string;
  appName: string;
  reservationFeePercentage: number;
  businessHours: BusinessHours;
  rentalHourlyRate?: number;
  rentalHalfHourRate?: number;
  commissionBasis?: 'RENTAL_ONLY' | 'TOTAL_PRICE';
}

export interface VoucherTerms {
  id: string;
  terms: string;
}

export interface CommissionReportEntry {
  userId: string;
  userName: string;
  eventId: string;
  eventDate: string;
  eventTotalPrice: number;
  rentalRevenue: number;
  commissionPercentage: number;
  commissionValue: number;
  clientName: string;
  status: 'PENDING' | 'PAID';
  expenseId?: string;
}

