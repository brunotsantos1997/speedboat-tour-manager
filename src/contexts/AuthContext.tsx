import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, UserStatus } from '../core/domain/User';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  updateEmail as firebaseUpdateEmail,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  clearIndexedDbPersistence,
  terminate
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import DOMPurify from 'dompurify';
import { auditLogRepository } from '../core/repositories/AuditLogRepository';
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { clientRepository } from '../core/repositories/ClientRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';

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

const validatePassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
  if (!hasUpperCase) {
    throw new Error('A senha deve conter pelo menos uma letra maiúscula.');
  }
  if (!hasLowerCase) {
    throw new Error('A senha deve conter pelo menos uma letra minúscula.');
  }
  if (!hasNumbers) {
    throw new Error('A senha deve conter pelo menos um número.');
  }
  if (!hasSpecialChars) {
    throw new Error('A senha deve conter pelo menos um caractere especial.');
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const disposeRepositories = () => {
    productRepository.dispose();
    boatRepository.dispose();
    boardingLocationRepository.dispose();
    clientRepository.dispose();
    eventRepository.dispose();
    VoucherAppearanceRepository.getInstance().dispose();
    VoucherTermsRepository.getInstance().dispose();
    CompanyDataRepository.getInstance().dispose();
  };

  const initializeRepositories = (user: User) => {
    productRepository.initialize(user);
    boatRepository.initialize(user);
    boardingLocationRepository.initialize(user);
    clientRepository.initialize(user);
    eventRepository.initialize(user);
    VoucherAppearanceRepository.getInstance().initialize(user);
    VoucherTermsRepository.getInstance().initialize(user);
    CompanyDataRepository.getInstance().initialize(user);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as User;
          if (profileData.status === 'APPROVED') {
            const user = { ...profileData, id: firebaseUser.uid };
            setCurrentUser(user);
            initializeRepositories(user);
          } else {
            setCurrentUser(null);
            await logout();
          }
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        disposeRepositories();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const profileRef = doc(db, 'profiles', firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      await logout();
      throw new Error("Perfil não encontrado.");
    }

    const profileData = profileSnap.data() as User;
    if (profileData.status !== 'APPROVED') {
      await logout();
      throw new Error("Sua conta ainda não foi aprovada.");
    }

    const user = { ...profileData, id: firebaseUser.uid };
    setCurrentUser(user);
    initializeRepositories(user);

    await auditLogRepository.log({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
    });

    return user;
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    validatePassword(password);
    const sanitizedName = DOMPurify.sanitize(name);
    const sanitizedEmail = DOMPurify.sanitize(email);

    const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
    const firebaseUser = userCredential.user;

    await firebaseUpdateProfile(firebaseUser, { displayName: sanitizedName });

    const newUser: User = {
      id: firebaseUser.uid,
      name: sanitizedName,
      email: sanitizedEmail,
      status: 'PENDING',
      role: 'ADMIN',
      commissionPercentage: 0,
    };

    await setDoc(doc(db, 'profiles', firebaseUser.uid), newUser);

    return newUser;
  };

  const logout = async () => {
    if (currentUser) {
      await auditLogRepository.log({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'LOGOUT',
      });
    }
    setCurrentUser(null);
    disposeRepositories();
    await signOut(auth);
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch (e) {
      console.warn("Firestore termination/persistence clear failed:", e);
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!currentUser || (currentUser.role === 'SELLER')) {
      throw new Error('Você não tem permissão para listar usuários.');
    }
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    let users = querySnapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id }));

    // hierarchy restrictions
    if (currentUser.role === 'SUPER_ADMIN') {
      users = users.filter(u => u.role !== 'OWNER');
    } else if (currentUser.role === 'ADMIN') {
      users = users.filter(u => u.role !== 'OWNER' && u.role !== 'SUPER_ADMIN');
    }

    return users;
  };

  const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
    if (!currentUser || (currentUser.role === 'SELLER')) {
      throw new Error('Você não tem permissão para alterar o status de usuários.');
    }

    const profileRef = doc(db, 'profiles', userId);
    const targetSnap = await getDoc(profileRef);
    const targetData = targetSnap.data() as User;

    if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new Error('Você não tem permissão para alterar o status do proprietário.');
    }
    if (targetData?.role === 'SUPER_ADMIN' && currentUser.role === 'ADMIN') {
      throw new Error('Você não tem permissão para alterar o status de um Super Administrador.');
    }

    await updateDoc(profileRef, { status });

    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      collection: 'profiles',
      docId: userId,
      oldData: { ...targetData, id: userId },
      newData: { ...targetData, id: userId, status },
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, status } : null);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    if (!currentUser || (currentUser.role === 'SELLER')) {
      throw new Error('Você não tem permissão para alterar cargos.');
    }

    const profileRef = doc(db, 'profiles', userId);
    const targetSnap = await getDoc(profileRef);
    const targetData = targetSnap.data() as User;

    if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new Error('Você não tem permissão para alterar o cargo do proprietário.');
    }
    if (targetData?.role === 'SUPER_ADMIN' && currentUser.role === 'ADMIN') {
      throw new Error('Você não tem permissão para alterar o cargo de um Super Administrador.');
    }

    await updateDoc(profileRef, { role });

    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      collection: 'profiles',
      docId: userId,
      oldData: { ...targetData, id: userId },
      newData: { ...targetData, id: userId, role },
    });
  };

  const updateUserCommission = async (userId: string, commission: number): Promise<void> => {
    if (!currentUser || (currentUser.role === 'SELLER')) {
      throw new Error('Você não tem permissão para alterar comissões.');
    }
    if (commission < 0 || commission > 100) {
      throw new Error('A porcentagem de comissão deve estar entre 0 e 100.');
    }
    const profileRef = doc(db, 'profiles', userId);
    const targetSnap = await getDoc(profileRef);
    const targetData = targetSnap.data() as User;

    await updateDoc(profileRef, { commissionPercentage: commission });

    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      collection: 'profiles',
      docId: userId,
      oldData: { ...targetData, id: userId },
      newData: { ...targetData, id: userId, commissionPercentage: commission },
    });
  };

  const requestPasswordReset = async (email: string): Promise<User | null> => {
    await sendPasswordResetEmail(auth, email);

    const q = query(collection(db, 'profiles'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = { ...userDoc.data() as User, id: userDoc.id };
      if (userData.role !== 'OWNER') {
        await updateDoc(doc(db, 'profiles', userDoc.id), { status: 'PASSWORD_RESET_REQUESTED' });
      }
      return userData;
    }
    return null;
  };

  const approvePasswordReset = async (_approverId: string, _targetUserId: string): Promise<string> => {
    return "O Firebase gerencia o reset via e-mail enviado ao usuário.";
  };

  const setSecretQuestion = async (userId: string, question: string, answer: string): Promise<void> => {
    if (!currentUser || currentUser.id !== userId) {
      throw new Error('Você só pode configurar a pergunta secreta para sua própria conta.');
    }
    const profileRef = doc(db, 'profiles', userId);
    const secretAnswerHash = await bcrypt.hash(answer, 10);
    await updateDoc(profileRef, {
      secretQuestion: question,
      secretAnswerHash
    });
  };

  const verifySecretAnswer = async (email: string, answer: string): Promise<User | null> => {
    const q = query(collection(db, 'profiles'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error("Usuário não encontrado.");

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    if (!userData.secretAnswerHash) throw new Error("Pergunta secreta não configurada.");

    const isMatch = await bcrypt.compare(answer, userData.secretAnswerHash);
    if (!isMatch) {
      throw new Error('Resposta incorreta.');
    }
    return { ...userData, id: userDoc.id };
  };

  const resetPasswordAfterVerification = async (_userId: string, newPassword: string): Promise<void> => {
    if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error("Usuário não autenticado no Firebase para troca direta.");
    }
  };

  const updateProfile = async (userId: string, data: { name?: string; email?: string; newPassword?: string, oldPassword?: string }): Promise<void> => {
    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'OWNER' && currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para atualizar este perfil.');
    }

    const profileRef = doc(db, 'profiles', userId);
    const updates: any = {};

    if (data.name) {
      updates.name = DOMPurify.sanitize(data.name);
      if (auth.currentUser) await firebaseUpdateProfile(auth.currentUser, { displayName: updates.name });
    }

    if (data.email) {
      const sanitizedEmail = DOMPurify.sanitize(data.email);
      if (auth.currentUser) await firebaseUpdateEmail(auth.currentUser, sanitizedEmail);
      updates.email = sanitizedEmail;
    }

    if (data.newPassword) {
      validatePassword(data.newPassword);
      if (auth.currentUser) await firebaseUpdatePassword(auth.currentUser, data.newPassword);
    }

    const oldSnap = await getDoc(profileRef);
    const oldData = oldSnap.data();

    await updateDoc(profileRef, updates);

    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      collection: 'profiles',
      docId: userId,
      oldData: { ...oldData, id: userId },
      newData: { ...oldData, ...updates, id: userId },
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
