// =================================================================
// AUTH PROVIDER - RESPONSIBILIDADES E LIMITES
// =================================================================
// 
// O QUE ESTE PROVIDER FAZ:
// - Autenticação (login, signup, logout)
// - Gerenciamento de sessão e estado do usuário atual
// - Wrappers seguros para operações de perfil (delegando para ViewModels)
// - Bootstrap de repositories (após autenticação aprovada)
// 
// O QUE ESTE PROVIDER NÃO FAZ:
// - Regras de negócio de domínio (delegadas para ViewModels especializados)
// - Operações diretas de persistência (delegadas para repositories)
// - Enforcement de autorização (feito pelas regras do Firestore server-side)
// - Auditoria (delegada para AuditLogRepository, apenas acionada aqui)
// 
// OWNERSHIP CLARO:
// - Auth: login/logout/signup e estado da sessão
// - Profile: operações de CRUD via ProfileViewModel
// - Identity: reset de senha via PasswordResetViewModel  
// - User Management: operações administrativas via UserManagementViewModel
// - Repository Bootstrap: inicialização pós-autenticação, cleanup no logout
// =================================================================

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole, UserStatus, UserCommissionSettings } from '../../core/domain/User';
import { auth, db } from '../../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { googleTokenStore } from '../../core/utils/googleTokenStore';
import { auditLogRepository } from '../../core/repositories/AuditLogRepository';
import { productRepository } from '../../core/repositories/ProductRepository';
import { boatRepository } from '../../core/repositories/BoatRepository';
import { boardingLocationRepository } from '../../core/repositories/BoardingLocationRepository';
import { clientRepository } from '../../core/repositories/ClientRepository';
import { eventRepository } from '../../core/repositories/EventRepository';
import { expenseCategoryRepository } from '../../core/repositories/ExpenseCategoryRepository';
import { expenseRepository } from '../../core/repositories/ExpenseRepository';
import { incomeRepository } from '../../core/repositories/IncomeRepository';
import { paymentRepository } from '../../core/repositories/PaymentRepository';
import { tourTypeRepository } from '../../core/repositories/TourTypeRepository';
import { VoucherAppearanceRepository } from '../../core/repositories/VoucherAppearanceRepository';
import { VoucherTermsRepository } from '../../core/repositories/VoucherTermsRepository';
import { CompanyDataRepository } from '../../core/repositories/CompanyDataRepository';
import { useUserManagementViewModel } from '../../viewmodels/useUserManagementViewModel';
import { usePasswordResetViewModel } from '../../viewmodels/usePasswordResetViewModel';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import { AuthContext, type AuthContextType } from './AuthContext';

const validatePassword = (password: string) => {
  if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
  if (!/[A-Z]/.test(password)) throw new Error('A senha deve conter pelo menos uma letra maiúscula.');
  if (!/[a-z]/.test(password)) throw new Error('A senha deve conter pelo menos uma letra minúscula.');
  if (!/\d/.test(password)) throw new Error('A senha deve conter pelo menos um número.');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) throw new Error('A senha deve conter pelo menos um caractere especial.');
};

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

// Bootstrap de repositories - responsabilidade do AuthProvider
// Inicializa repositories com contexto de usuário após autenticação aprovada
// Isso é necessário porque repositories precisam saber qual usuário está operando
// para queries e validações, mas as regras de negócio ficam nos ViewModels
const initializeRepositories = (user: User) => {
  productRepository.initialize(user);
  boatRepository.initialize(user);
  boardingLocationRepository.initialize(user);
  clientRepository.initialize(user);
  eventRepository.initialize(user);
  expenseCategoryRepository.initialize(user);
  expenseRepository.initialize(user);
  incomeRepository.initialize(user);
  paymentRepository.initialize(); // PaymentRepository não usa contexto de usuário
  tourTypeRepository.initialize(user);
  VoucherAppearanceRepository.getInstance().initialize(user);
  VoucherTermsRepository.getInstance().initialize(user);
  CompanyDataRepository.getInstance().initialize(user);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(googleTokenStore.get());

  const userMgmt = useUserManagementViewModel();
  const passwordReset = usePasswordResetViewModel();
  const profileVm = useProfileViewModel();

  const handleUserUpdated = useCallback((updates: Partial<User>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setLinkedProviders(firebaseUser.providerData.map((p) => p.providerId));
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

    if (!profileSnap.exists()) { await logout(); throw new Error('Perfil não encontrado.'); }
    const profileData = profileSnap.data() as User;
    if (profileData.status !== 'APPROVED') { await logout(); throw new Error('Sua conta ainda não foi aprovada.'); }

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
    const newUser: User = { id: firebaseUser.uid, name: sanitizedName, email: sanitizedEmail, status: 'PENDING', role: 'SELLER', commissionPercentage: 0 };
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
      if (credential?.accessToken) { googleTokenStore.set(credential.accessToken); setGoogleAccessToken(credential.accessToken); }
      const firebaseUser = result.user;
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as User;
        if (profileData.status !== 'APPROVED') { await logout(); throw new Error('Sua conta ainda não foi aprovada.'); }
        const user = { ...profileData, id: firebaseUser.uid };
        setCurrentUser(user);
        initializeRepositories(user);
        return user;
      }
      const newUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || 'Usuário Google', email: firebaseUser.email || '', status: 'PENDING', role: 'SELLER', commissionPercentage: 0 };
      await setDoc(profileRef, newUser);
      await logout();
      throw new Error('Conta criada com sucesso! Aguarde a aprovação de um administrador.');
    } catch (error: unknown) {
      const fe = error as { code?: string };
      if (fe.code === 'auth/account-exists-with-different-credential') throw new Error('Este e-mail já está associado a uma conta. Por favor, faça login com seu e-mail e senha para vincular sua conta do Google nas configurações de perfil.');
      throw error;
    }
  };

  const linkGoogle = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) { googleTokenStore.set(credential.accessToken); setGoogleAccessToken(credential.accessToken); }
      setLinkedProviders(result.user.providerData.map((p) => p.providerId));
    } catch (error: unknown) {
      const fe = error as { code?: string };
      if (fe.code === 'auth/credential-already-in-use') throw new Error('Esta conta do Google já está vinculada a outro usuário do sistema.');
      if (fe.code === 'auth/provider-already-linked') {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) { googleTokenStore.set(credential.accessToken); setGoogleAccessToken(credential.accessToken); }
        return;
      }
      throw error;
    }
  };

  const unlinkGoogle = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    try {
      await unlink(auth.currentUser, 'google.com');
      setLinkedProviders(auth.currentUser.providerData.map((p) => p.providerId));
      googleTokenStore.clear();
      setGoogleAccessToken(null);
      if (currentUser) await updateCalendarSettings(currentUser.id, { calendarId: '', autoSync: false });
    } catch (error: unknown) {
      const fe = error as { code?: string };
      if (fe.code === 'auth/no-such-provider') return;
      throw error;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    googleTokenStore.clear();
    setGoogleAccessToken(null);
    disposeRepositories();
    await signOut(auth);
  };

  // Thin wrappers que injetam currentUser nos ViewModels delegados
  const getAllUsers = async () => { if (!currentUser) throw new Error('Usuário não autenticado.'); return userMgmt.getAllUsers(currentUser); };
  const updateUserStatus = async (userId: string, status: UserStatus) => { 
    if (!currentUser) throw new Error('Usuário não autenticado.'); 
    await userMgmt.updateUserStatus(currentUser, userId, status); 
    if (currentUser.id === userId) handleUserUpdated({ status });
    
    // Auditoria da operação crítica
    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: userId,
      action: 'UPDATE_USER_STATUS',
      resource: 'user',
      context: { newStatus: status }
    });
  };
  const updateUserRole = async (userId: string, role: UserRole) => { 
    if (!currentUser) throw new Error('Usuário não autenticado.'); 
    await userMgmt.updateUserRole(currentUser, userId, role); 
    
    // Auditoria da operação crítica
    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: userId,
      action: 'UPDATE_USER_ROLE',
      resource: 'user',
      context: { newRole: role }
    });
  };
  const updateUserCommissionSettings = async (userId: string, settings: UserCommissionSettings) => { 
    if (!currentUser) throw new Error('Usuário não autenticado.'); 
    await userMgmt.updateUserCommissionSettings(currentUser, userId, settings); 
    
    // Auditoria da operação crítica
    await auditLogRepository.log({
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: userId,
      action: 'UPDATE_COMMISSION_SETTINGS',
      resource: 'user',
      context: { newSettings: settings }
    });
  };
  const requestPasswordReset = async (email: string) => {
    await passwordReset.requestPasswordReset(email);
    
    // Auditoria da operação sensível
    if (currentUser) {
      await auditLogRepository.log({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'auth',
        context: { targetEmail: email }
      });
    }
  };
  const updateProfile = async (userId: string, data: { name?: string; email?: string; newPassword?: string; oldPassword?: string }) => { if (!currentUser) throw new Error('Usuário não autenticado.'); await profileVm.updateProfile(currentUser, userId, data, handleUserUpdated); };
  const updateCalendarSettings = async (userId: string, settings: { calendarId?: string; autoSync: boolean }) => { if (!currentUser) throw new Error('Usuário não autenticado.'); await profileVm.updateCalendarSettings(currentUser, userId, settings, handleUserUpdated); };
  const updateCompletedTours = async (_userId: string, tourId: string) => { if (!currentUser) return; await profileVm.updateCompletedTours(currentUser, tourId, handleUserUpdated); };
  const resetTours = async (_userId: string) => { if (!currentUser) return; await profileVm.resetTours(currentUser, handleUserUpdated); };

  const value: AuthContextType = {
    currentUser, loading, login, loginWithGoogle, linkGoogle, unlinkGoogle, signup, logout,
    updateUserStatus, updateUserRole, updateUserCommissionSettings, getAllUsers,
    updateProfile, updateCalendarSettings, updateCompletedTours, resetTours,
    requestPasswordReset,
    linkedProviders, googleAccessToken, setGoogleAccessToken,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
