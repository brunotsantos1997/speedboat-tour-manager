export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'SELLER';

export interface UserCommissionSettings {
  rentalEnabled: boolean;
  rentalPercentage: number;
  rentalBase: 'GROSS' | 'NET';
  deductRentalCost: boolean;
  productEnabled: boolean;
  productPercentage: number;
  productBase: 'GROSS' | 'NET';
  deductProductCost: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  deductTaxCost: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  status: UserStatus;
  role: UserRole;
  commissionPercentage?: number;
  commissionSettings?: UserCommissionSettings;
  mustChangePassword?: boolean;
  calendarSettings?: {
    calendarId?: string;
    autoSync: boolean;
  };
  completedTours?: string[];
}
