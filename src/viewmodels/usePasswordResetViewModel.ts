import { useCallback } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const usePasswordResetViewModel = () => {
  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const approvePasswordReset = useCallback(
    async (_approverId: string, targetUserId: string): Promise<string> => {
      const profileRef = doc(db, 'profiles', targetUserId);
      await updateDoc(profileRef, { status: 'APPROVED' });
      return 'O fluxo legado foi liberado. Oriente o usuario a usar a redefinicao por e-mail na tela de login.';
    },
    []
  );

  return {
    requestPasswordReset,
    approvePasswordReset,
  };
};
