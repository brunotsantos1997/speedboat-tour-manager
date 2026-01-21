export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'OWNER' | 'SUPER_ADMIN' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  role: UserRole;
  commissionPercentage?: number;
  mustChangePassword?: boolean;
}
