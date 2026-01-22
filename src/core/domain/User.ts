export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PASSWORD_RESET_REQUESTED';
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
  secretQuestion?: string;
  secretAnswerHash?: string;
}
