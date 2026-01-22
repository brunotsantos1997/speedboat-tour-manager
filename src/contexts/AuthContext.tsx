import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, UserStatus } from '../core/domain/User';
import type { IUserRepository } from '../core/domain/repositories/IUserRepository';
import { MockUserRepository } from '../core/infra/repositories/MockUserRepository';
import type { ILoginAttemptRepository } from '../core/domain/repositories/ILoginAttemptRepository';
import { MockLoginAttemptRepository } from '../core/infra/repositories/MockLoginAttemptRepository';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserCommission: (userId: string, commission: number) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  updateProfile: (userId: string, data: { name?: string; email?: string; newPassword?: string, oldPassword?: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<User | null>;
  approvePasswordReset: (approverId: string, targetUserId: string) => Promise<string>;
  setSecretQuestion: (userId: string, question: string, answer: string) => Promise<void>;
  verifySecretAnswer: (email: string, answer: string) => Promise<User | null>;
  resetPasswordAfterVerification: (userId: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userRepository: IUserRepository = MockUserRepository.getInstance();
const loginAttemptRepository: ILoginAttemptRepository = MockLoginAttemptRepository.getInstance();
const SESSION_KEY = 'auth_user_id';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

const validatePassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    throw new Error('Password must be at least 8 characters long.');
  }
  if (!hasUpperCase) {
    throw new Error('Password must contain at least one uppercase letter.');
  }
  if (!hasLowerCase) {
    throw new Error('Password must contain at least one lowercase letter.');
  }
  if (!hasNumbers) {
    throw new Error('Password must contain at least one number.');
  }
  if (!hasSpecialChars) {
    throw new Error('Password must contain at least one special character.');
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const userId = localStorage.getItem(SESSION_KEY);
        if (userId) {
          const user = await userRepository.findById(userId);
          if (user && user.status === 'APPROVED') {
            setCurrentUser(user);
          } else {
            // User might be pending or rejected, clear session
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to check user session:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const now = Date.now();
    const attempt = await loginAttemptRepository.findByEmail(email);

    if (attempt && now - attempt.timestamp < LOCK_TIME && attempt.count >= MAX_LOGIN_ATTEMPTS) {
      const timeLeft = Math.ceil((LOCK_TIME - (now - attempt.timestamp)) / 1000 / 60);
      throw new Error(`Too many failed login attempts. Please try again in ${timeLeft} minutes.`);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempt = {
        email,
        count: (attempt?.count || 0) + 1,
        timestamp: now,
      };
      await loginAttemptRepository.save(newAttempt);
      throw new Error("Invalid credentials.");
    }

    if (user.status !== 'APPROVED') {
        throw new Error("User is not approved.");
    }

    await loginAttemptRepository.delete(email);
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    validatePassword(password);
    const sanitizedName = DOMPurify.sanitize(name);
    const sanitizedEmail = DOMPurify.sanitize(email);
    const existingUser = await userRepository.findByEmail(sanitizedEmail);
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const allUsers = await userRepository.findAll();
    const isFirstUser = allUsers.length === 1; // The first user signs up when only the OWNER exists

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: uuidv4(),
      name: sanitizedName,
      email: sanitizedEmail,
      passwordHash,
      status: isFirstUser ? 'APPROVED' : 'PENDING',
      role: isFirstUser ? 'SUPER_ADMIN' : 'ADMIN',
    };

    await userRepository.save(newUser);
    if (isFirstUser) {
        setCurrentUser(newUser);
        localStorage.setItem(SESSION_KEY, newUser.id);
    }

    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const getAllUsers = async (): Promise<User[]> => {
    return await userRepository.findAll();
  };

  const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    user.status = status;
    await userRepository.update(user);
    // Optional: update current user if their own status changes
    if (currentUser?.id === userId) {
      setCurrentUser(user);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'OWNER')) {
      throw new Error('You do not have permission to change user roles.');
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    user.role = role;
    await userRepository.update(user);
  };

  const updateUserCommission = async (userId: string, commission: number): Promise<void> => {
    if (commission < 0 || commission > 100) {
      throw new Error('Commission percentage must be between 0 and 100.');
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    user.commissionPercentage = commission;
    await userRepository.update(user);
  };

  const requestPasswordReset = async (email: string): Promise<User | null> => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.role !== 'OWNER') {
      user.status = 'PASSWORD_RESET_REQUESTED';
      await userRepository.update(user);
    }

    return user;
  };

  const approvePasswordReset = async (approverId: string, targetUserId: string): Promise<string> => {
    const approver = await userRepository.findById(approverId);
    const targetUser = await userRepository.findById(targetUserId);

    if (!approver || !targetUser) {
      throw new Error('User not found.');
    }

    const rolesHierarchy: { [key in UserRole]: number } = {
      'ADMIN': 1,
      'SUPER_ADMIN': 2,
      'OWNER': 3,
    };

    if (rolesHierarchy[approver.role] < rolesHierarchy[targetUser.role]) {
      throw new Error('You do not have permission to approve this request.');
    }

    const temporaryPassword = uuidv4().substring(0, 8);
    targetUser.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    targetUser.mustChangePassword = true;
    targetUser.status = 'APPROVED';
    await userRepository.update(targetUser);
    return temporaryPassword;
  };

  const setSecretQuestion = async (userId: string, question: string, answer: string): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'OWNER') {
      throw new Error('Unauthorized or user not found.');
    }

    user.secretQuestion = question;
    user.secretAnswerHash = await bcrypt.hash(answer, 10);
    await userRepository.update(user);
  };

  const verifySecretAnswer = async (email: string, answer: string): Promise<User | null> => {
    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== 'OWNER' || !user.secretAnswerHash) {
      throw new Error('Invalid user or no secret question set.');
    }

    const isAnswerValid = await bcrypt.compare(answer, user.secretAnswerHash);
    if (!isAnswerValid) {
      throw new Error('Incorrect answer.');
    }
    return user;
  };

  const resetPasswordAfterVerification = async (userId: string, newPassword: string): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await userRepository.update(user);
  };

  const updateProfile = async (userId: string, data: { name?: string; email?: string; newPassword?: string, oldPassword?: string }): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (data.name) {
      user.name = DOMPurify.sanitize(data.name);
    }
    if (data.email) {
      const sanitizedEmail = DOMPurify.sanitize(data.email);
      const existingUser = await userRepository.findByEmail(sanitizedEmail);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use.');
      }
      user.email = sanitizedEmail;
    }
    if (data.newPassword) {
      validatePassword(data.newPassword);
      if (!data.oldPassword) {
        throw new Error('Old password is required to set a new password.');
      }
      const isPasswordValid = await bcrypt.compare(data.oldPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid old password.');
      }
      user.passwordHash = await bcrypt.hash(data.newPassword, 10);
      user.mustChangePassword = false;
    }

    await userRepository.update(user);
    if (currentUser?.id === userId) {
      setCurrentUser(user);
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateUserStatus,
    updateUserRole,
    updateUserCommission,
    getAllUsers,
    updateProfile,
    requestPasswordReset,
    approvePasswordReset,
    setSecretQuestion,
    verifySecretAnswer,
    resetPasswordAfterVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
