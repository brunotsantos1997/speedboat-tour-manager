import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, UserStatus, UserCommissionSettings } from '../core/domain/User';
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
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
  fetchSignInMethodsForEmail
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
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { clientRepository } from '../core/repositories/ClientRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseCategoryRepository } from '../core/repositories/ExpenseCategoryRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  linkGoogle: () => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserCommissionSettings: (userId: string, settings: UserCommissionSettings) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  updateProfile: (userId: string, data: { name?: string; email?: string; newPassword?: string, oldPassword?: string }) => Promise<void>;
  updateCalendarSettings: (userId: string, settings: { calendarId?: string; autoSync: boolean }) => Promise<void>;
  updateCompletedTours: (userId: string, tourId: string) => Promise<void>;
  resetTours: (userId: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<User | null>;
  approvePasswordReset: (approverId: string, targetUserId: string) => Promise<string>;
  setSecretQuestion: (userId: string, question: string, answer: string) => Promise<void>;
  verifySecretAnswer: (email: string, answer: string) => Promise<User | null>;
  resetPasswordAfterVerification: (userId: string, newPassword: string) => Promise<void>;
  linkedProviders: string[];
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
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
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));

  const disposeRepositories = () => {
    productRepository.dispose();
    boatRepository.dispose();
    boardingLocationRepository.dispose();
    clientRepository.dispose();
    eventRepository.dispose();
    expenseCategoryRepository.dispose();
    expenseRepository.dispose();
    incomeRepository.dispose();
    paymentRepository.dispose();
    tourTypeRepository.dispose();
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
    expenseCategoryRepository.initialize(user);
    expenseRepository.initialize(user);
    incomeRepository.initialize(user);
    paymentRepository.initialize(user);
    tourTypeRepository.initialize(user);
    VoucherAppearanceRepository.getInstance().initialize(user);
    VoucherTermsRepository.getInstance().initialize(user);
    CompanyDataRepository.getInstance().initialize(user);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setLinkedProviders(firebaseUser.providerData.map(p => p.providerId));
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
        setLinkedProviders([]);
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
      role: 'SELLER',
      commissionPercentage: 0,
    };

    await setDoc(doc(db, 'profiles', firebaseUser.uid), newUser);

    return newUser;
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        localStorage.setItem('google_access_token', credential.accessToken);
      }
      const firebaseUser = result.user;

      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as User;
        if (profileData.status !== 'APPROVED') {
          await logout();
          throw new Error("Sua conta ainda não foi aprovada.");
        }
        const user = { ...profileData, id: firebaseUser.uid };
        setCurrentUser(user);
        initializeRepositories(user);
        return user;
      } else {
        // Check if user with same email exists with different provider
        const methods = await fetchSignInMethodsForEmail(auth, firebaseUser.email!);
        if (methods.length > 0) {
          // If we are here, it means we somehow signed in but no profile exists for this UID.
          // This could happen if they have an email/password account but the UIDs are different?
          // Actually, if they use the same email, Firebase might have merged them OR thrown an error.
          // If "One account per email" is on, it should have thrown an error before getting here.
        }

        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário Google',
          email: firebaseUser.email || '',
          status: 'PENDING',
          role: 'SELLER',
          commissionPercentage: 0,
        };
        await setDoc(profileRef, newUser);
        await logout();
        throw new Error("Conta criada com sucesso! Aguarde a aprovação de um administrador.");
      }
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error("Este e-mail já está associado a uma conta. Por favor, faça login com seu e-mail e senha para vincular sua conta do Google nas configurações de perfil.");
      }
      throw error;
    }
  };

  const linkGoogle = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.setCustomParameters({
      prompt: 'consent'
    });
    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        localStorage.setItem('google_access_token', credential.accessToken);
      }
      setLinkedProviders(result.user.providerData.map(p => p.providerId));
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error("Esta conta do Google já está vinculada a outro usuário do sistema. Se esta é sua conta, você pode ter outro login ativo.");
      }
      if (error.code === 'auth/provider-already-linked') {
        // If already linked, we might want to re-authenticate to get a new token with scopes
        // But Firebase linkWithPopup might not work if already linked.
        // Try signInWithPopup to get a new credential then link? No.
        // Best approach if already linked is to just do signInWithPopup with the same provider
        // but that might create a new user or merge.
        // Actually, for refreshing tokens/scopes, we can use signInWithPopup even if linked.
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setGoogleAccessToken(credential.accessToken);
          localStorage.setItem('google_access_token', credential.accessToken);
        }
        return;
      }
      throw error;
    }
  };

  const unlinkGoogle = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    try {
      await unlink(auth.currentUser, 'google.com');
      setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
      setGoogleAccessToken(null);
      localStorage.removeItem('google_access_token');

      if (currentUser) {
        await updateCalendarSettings(currentUser.id, {
          calendarId: '',
          autoSync: false
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/no-such-provider') {
        return; // Already unlinked
      }
      throw error;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setGoogleAccessToken(null);
    localStorage.removeItem('google_access_token');
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
  };

  const updateUserCommissionSettings = async (userId: string, settings: UserCommissionSettings): Promise<void> => {
    if (!currentUser || (currentUser.role === 'SELLER')) {
      throw new Error('Você não tem permissão para alterar comissões.');
    }
    const profileRef = doc(db, 'profiles', userId);
    const targetSnap = await getDoc(profileRef);
    const targetData = targetSnap.data() as User;

    if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new Error('Você não tem permissão para alterar a comissão do proprietário.');
    }
    if (targetData?.role === 'SUPER_ADMIN' && currentUser.role === 'ADMIN') {
      throw new Error('Você não tem permissão para alterar a comissão de um Super Administrador.');
    }

    await updateDoc(profileRef, { commissionSettings: settings });
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

    await updateDoc(profileRef, updates);

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }

  const updateCalendarSettings = async (userId: string, settings: { calendarId?: string; autoSync: boolean }): Promise<void> => {
    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'OWNER' && currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para atualizar estas configurações.');
    }

    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, { calendarSettings: settings });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, calendarSettings: settings } : null);
    }
  };

  const updateCompletedTours = async (userId: string, tourId: string): Promise<void> => {
    if (!currentUser || currentUser.id !== userId) return;

    const profileRef = doc(db, 'profiles', userId);
    const updatedTours = [...(currentUser.completedTours || []), tourId];

    await updateDoc(profileRef, { completedTours: updatedTours });
    setCurrentUser(prev => prev ? { ...prev, completedTours: updatedTours } : null);
  };

  const resetTours = async (userId: string): Promise<void> => {
    if (!currentUser || currentUser.id !== userId) return;

    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, { completedTours: [] });
    setCurrentUser(prev => prev ? { ...prev, completedTours: [] } : null);
  };

  const value = {
    currentUser,
    loading,
    login,
    loginWithGoogle,
    linkGoogle,
    unlinkGoogle,
    signup,
    logout,
    updateUserStatus,
    updateUserRole,
    updateUserCommissionSettings,
    getAllUsers,
    updateProfile,
    updateCalendarSettings,
    updateCompletedTours,
    resetTours,
    requestPasswordReset,
    approvePasswordReset,
    setSecretQuestion,
    verifySecretAnswer,
    resetPasswordAfterVerification,
    linkedProviders,
    googleAccessToken,
    setGoogleAccessToken,
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
