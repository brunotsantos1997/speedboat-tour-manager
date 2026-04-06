// src/viewmodels/useUserManagementViewModel.ts
import { useCallback } from 'react';
import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
} from 'firebase/firestore';
import type { User, UserRole, UserStatus, UserCommissionSettings } from '../core/domain/User';

/**
 * Gerencia operações administrativas de usuários:
 * listagem, alteração de status, role e configurações de comissão.
 *
 * Recebe o currentUser como parâmetro para não depender do AuthContext,
 * facilitando testes unitários.
 */
export const useUserManagementViewModel = () => {
  const getAllUsers = useCallback(async (currentUser: User): Promise<User[]> => {
    if (currentUser.role === 'SELLER') {
      throw new Error('Você não tem permissão para listar usuários.');
    }

    const querySnapshot = await getDocs(collection(db, 'profiles'));
    let users = querySnapshot.docs.map((d) => ({
      ...d.data() as User,
      id: d.id,
    }));

    if (currentUser.role === 'SUPER_ADMIN') {
      users = users.filter((u) => u.role !== 'OWNER');
    } else if (currentUser.role === 'ADMIN') {
      users = users.filter(
        (u) => u.role !== 'OWNER' && u.role !== 'SUPER_ADMIN'
      );
    }

    return users;
  }, []);

  const updateUserStatus = useCallback(
    async (
      currentUser: User,
      userId: string,
      status: UserStatus
    ): Promise<void> => {
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar o status de usuários.');
      }

      const profileRef = doc(db, 'profiles', userId);
      const targetSnap = await getDoc(profileRef);
      const targetData = targetSnap.data() as User;

      if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
        throw new Error('Você não tem permissão para alterar o status do proprietário.');
      }
      if (
        targetData?.role === 'SUPER_ADMIN' &&
        currentUser.role === 'ADMIN'
      ) {
        throw new Error(
          'Você não tem permissão para alterar o status de um Super Administrador.'
        );
      }

      await updateDoc(profileRef, { status });
    },
    []
  );

  const updateUserRole = useCallback(
    async (
      currentUser: User,
      userId: string,
      role: UserRole
    ): Promise<void> => {
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar cargos.');
      }

      const profileRef = doc(db, 'profiles', userId);
      const targetSnap = await getDoc(profileRef);
      const targetData = targetSnap.data() as User;

      if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
        throw new Error('Você não tem permissão para alterar o cargo do proprietário.');
      }
      if (
        targetData?.role === 'SUPER_ADMIN' &&
        currentUser.role === 'ADMIN'
      ) {
        throw new Error(
          'Você não tem permissão para alterar o cargo de um Super Administrador.'
        );
      }

      await updateDoc(profileRef, { role });
    },
    []
  );

  const updateUserCommissionSettings = useCallback(
    async (
      currentUser: User,
      userId: string,
      settings: UserCommissionSettings
    ): Promise<void> => {
      if (currentUser.role === 'SELLER') {
        throw new Error('Você não tem permissão para alterar comissões.');
      }

      const profileRef = doc(db, 'profiles', userId);
      const targetSnap = await getDoc(profileRef);
      const targetData = targetSnap.data() as User;

      if (targetData?.role === 'OWNER' && currentUser.role !== 'OWNER') {
        throw new Error('Você não tem permissão para alterar a comissão do proprietário.');
      }
      if (
        targetData?.role === 'SUPER_ADMIN' &&
        currentUser.role === 'ADMIN'
      ) {
        throw new Error(
          'Você não tem permissão para alterar a comissão de um Super Administrador.'
        );
      }

      await updateDoc(profileRef, { commissionSettings: settings });
    },
    []
  );

  return {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    updateUserCommissionSettings,
  };
};
