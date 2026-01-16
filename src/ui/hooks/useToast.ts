// src/ui/hooks/useToast.ts
import { useState } from 'react';

export const useToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const hideToast = () => {
    setToastMessage(null);
  };

  return {
    toastMessage,
    showToast,
    hideToast,
  };
};
