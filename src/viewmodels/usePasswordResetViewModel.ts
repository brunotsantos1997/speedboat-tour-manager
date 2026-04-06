import { useCallback } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const usePasswordResetViewModel = () => {
  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  return {
    requestPasswordReset,
  };
};
