import { type ReactNode } from 'react';
import { ToastContext, type ToastContextType } from './ToastContext';

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`Toast ${type}: ${message}`);
  };

  const value: ToastContextType = {
    showToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
