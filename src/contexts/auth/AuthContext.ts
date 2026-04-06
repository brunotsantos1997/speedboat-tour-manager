import { createContext } from 'react';
import type { User, UserRole, UserStatus, UserCommissionSettings } from '../../core/domain/User';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  linkGoogle: () => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserCommissionSettings: (userId: string, settings: UserCommissionSettings) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  updateProfile: (userId: string, data: { name?: string; email?: string; newPassword?: string; oldPassword?: string }) => Promise<void>;
  updateCalendarSettings: (userId: string, settings: { calendarId?: string; autoSync: boolean }) => Promise<void>;
  updateCompletedTours: (userId: string, tourId: string) => Promise<void>;
  resetTours: (userId: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  linkedProviders: string[];
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
