// src/viewmodels/useProfileViewModel.ts
import { useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import {
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  updateEmail as firebaseUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import type { User } from '../core/domain/User';

const validatePassword = (password: string) => {
  if (password.length < 8)
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  if (!/[A-Z]/.test(password))
    throw new Error('A senha deve conter pelo menos uma letra maiúscula.');
  if (!/[a-z]/.test(password))
    throw new Error('A senha deve conter pelo menos uma letra minúscula.');
  if (!/\d/.test(password))
    throw new Error('A senha deve conter pelo menos um número.');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    throw new Error('A senha deve conter pelo menos um caractere especial.');
};

/**
 * Gerencia operações de perfil do usuário autenticado:
 * atualização de dados pessoais, configurações de calendário e tours.
 */
export const useProfileViewModel = () => {
  const updateProfile = useCallback(
    async (
      currentUser: User,
      userId: string,
      data: {
        name?: string;
        email?: string;
        newPassword?: string;
        oldPassword?: string;
      },
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const canEdit =
        currentUser.id === userId ||
        currentUser.role === 'OWNER' ||
        currentUser.role === 'SUPER_ADMIN';

      if (!canEdit) {
        throw new Error('Você não tem permissão para atualizar este perfil.');
      }

      const profileRef = doc(db, 'profiles', userId);
      const updates: Partial<User> = {};

      if (data.name) {
        updates.name = DOMPurify.sanitize(data.name);
        if (auth.currentUser) {
          await firebaseUpdateProfile(auth.currentUser, {
            displayName: updates.name,
          });
        }
      }

      if (data.email) {
        const sanitizedEmail = DOMPurify.sanitize(data.email);
        if (auth.currentUser) {
          // Reautenticação obrigatória para mudança de email
          if (!data.oldPassword) {
            throw new Error('Senha atual é obrigatória para alterar o e-mail.');
          }
          const credential = EmailAuthProvider.credential(auth.currentUser.email!, data.oldPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await firebaseUpdateEmail(auth.currentUser, sanitizedEmail);
        }
        updates.email = sanitizedEmail;
      }

      if (data.newPassword) {
        validatePassword(data.newPassword);
        if (auth.currentUser) {
          // Reautenticação obrigatória para mudança de senha
          if (!data.oldPassword) {
            throw new Error('Senha atual é obrigatória para alterar a senha.');
          }
          const credential = EmailAuthProvider.credential(auth.currentUser.email!, data.oldPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await firebaseUpdatePassword(auth.currentUser, data.newPassword);
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(profileRef, updates);
        if (currentUser.id === userId) {
          onUserUpdated(updates);
        }
      }
    },
    []
  );

  const updateCalendarSettings = useCallback(
    async (
      currentUser: User,
      userId: string,
      settings: { calendarId?: string; autoSync: boolean },
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const canEdit =
        currentUser.id === userId ||
        currentUser.role === 'OWNER' ||
        currentUser.role === 'SUPER_ADMIN';

      if (!canEdit) {
        throw new Error('Você não tem permissão para atualizar estas configurações.');
      }

      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, { calendarSettings: settings });

      if (currentUser.id === userId) {
        onUserUpdated({ calendarSettings: settings });
      }
    },
    []
  );

  const updateCompletedTours = useCallback(
    async (
      currentUser: User,
      tourId: string,
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const profileRef = doc(db, 'profiles', currentUser.id);
      const updatedTours = [...(currentUser.completedTours ?? []), tourId];
      await updateDoc(profileRef, { completedTours: updatedTours });
      onUserUpdated({ completedTours: updatedTours });
    },
    []
  );

  const resetTours = useCallback(
    async (
      currentUser: User,
      onUserUpdated: (updates: Partial<User>) => void
    ): Promise<void> => {
      const profileRef = doc(db, 'profiles', currentUser.id);
      await updateDoc(profileRef, { completedTours: [] });
      onUserUpdated({ completedTours: [] });
    },
    []
  );

  return {
    updateProfile,
    updateCalendarSettings,
    updateCompletedTours,
    resetTours,
  };
};
