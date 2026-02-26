import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InformationModal } from '../components/InformationModal';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface InformationState {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  resolve: () => void;
}

interface ModalContextType {
  confirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: ReactNode) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => {},
  });

  const [information, setInformation] = useState<InformationState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => {},
  });

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((title: string, message: ReactNode): Promise<void> => {
    return new Promise((resolve) => {
      setInformation({
        isOpen: true,
        title,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    confirmation.resolve(true);
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    confirmation.resolve(false);
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCloseInformation = () => {
    information.resolve();
    setInformation((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert }}>
      {children}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <InformationModal
        isOpen={information.isOpen}
        title={information.title}
        message={information.message}
        onClose={handleCloseInformation}
      />
    </ModalContext.Provider>
  );
};
