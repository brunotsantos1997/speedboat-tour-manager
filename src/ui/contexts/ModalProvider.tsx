// src/ui/contexts/ModalProvider.tsx
import React, { useState, useCallback, type ReactNode } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InformationModal } from '../components/InformationModal';
import { ModalContext } from './modal/ModalContext';

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
    <ModalContext.Provider value={{ isModalOpen: confirmation.isOpen || information.isOpen, openModal: () => {}, closeModal: () => {}, confirm, showAlert }}>
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
