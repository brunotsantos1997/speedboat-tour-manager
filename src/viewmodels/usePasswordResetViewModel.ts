// src/viewmodels/usePasswordResetViewModel.ts
import { useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import {
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import type { User } from '../core/domain/User';

/**
 * Gerencia o fluxo completo de recuperação de senha:
 * - Solicitação por e-mail (Firebase)
 * - Pergunta secreta (configuração e verificação)
 * - Redefinição pós-verificação
 */
export const usePasswordResetViewModel = () => {
  const requestPasswordReset = useCallback(
    async (email: string): Promise<User | null> => {
      await sendPasswordResetEmail(auth, email);

      const q = query(collection(db, 'profiles'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { ...userDoc.data() as User, id: userDoc.id };
        if (userData.role !== 'OWNER') {
          await updateDoc(doc(db, 'profiles', userDoc.id), {
            status: 'PASSWORD_RESET_REQUESTED',
          });
        }
        return userData;
      }
      return null;
    },
    []
  );

  /**
   * Stub mantido para compatibilidade — Firebase gerencia o reset via e-mail.
   */
  const approvePasswordReset = useCallback(
    async (_approverId: string, _targetUserId: string): Promise<string> => {
      return 'O Firebase gerencia o reset via e-mail enviado ao usuário.';
    },
    []
  );

  const setSecretQuestion = useCallback(
    async (
      currentUserId: string,
      userId: string,
      question: string,
      answer: string
    ): Promise<void> => {
      if (currentUserId !== userId) {
        throw new Error(
          'Você só pode configurar a pergunta secreta para sua própria conta.'
        );
      }
      const profileRef = doc(db, 'profiles', userId);
      const secretAnswerHash = await bcrypt.hash(answer, 10);
      await updateDoc(profileRef, { secretQuestion: question, secretAnswerHash });
    },
    []
  );

  const verifySecretAnswer = useCallback(
    async (email: string, answer: string): Promise<User | null> => {
      const q = query(collection(db, 'profiles'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) throw new Error('Usuário não encontrado.');

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      if (!userData.secretAnswerHash)
        throw new Error('Pergunta secreta não configurada.');

      const isMatch = await bcrypt.compare(answer, userData.secretAnswerHash);
      if (!isMatch) throw new Error('Resposta incorreta.');

      return { ...userData, id: userDoc.id };
    },
    []
  );

  const resetPasswordAfterVerification = useCallback(
    async (_userId: string, newPassword: string): Promise<void> => {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado no Firebase para troca direta.');
      }
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    },
    []
  );

  return {
    requestPasswordReset,
    approvePasswordReset,
    setSecretQuestion,
    verifySecretAnswer,
    resetPasswordAfterVerification,
  };
};
