import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, UserStatus } from '../core/domain/User';
import type { IUserRepository } from '../core/domain/repositories/IUserRepository';
import { MockUserRepository } from '../core/infra/repositories/MockUserRepository';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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
  resetPassword: (userId: string) => Promise<string>;
  updateProfile: (userId: string, data: { name?: string; email?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userRepository: IUserRepository = MockUserRepository.getInstance();
const SESSION_KEY = 'auth_user_id';

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
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    if (user.status !== 'APPROVED') {
        throw new Error("User is not approved.");
    }

    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const allUsers = await userRepository.findAll();
    const isFirstUser = allUsers.length === 1; // The first user signs up when only the OWNER exists

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: uuidv4(),
      name,
      email,
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

  const resetPassword = async (userId: string): Promise<string> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    const temporaryPassword = uuidv4().substring(0, 8);
    user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    user.mustChangePassword = true;
    await userRepository.update(user);
    return temporaryPassword;
  };

  const updateProfile = async (userId: string, data: { name?: string; email?: string; password?: string }): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (data.name) {
      user.name = data.name;
    }
    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use.');
      }
      user.email = data.email;
    }
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
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
    resetPassword,
    updateProfile
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
