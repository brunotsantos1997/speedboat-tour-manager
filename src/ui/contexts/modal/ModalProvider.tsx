import { useState, type ReactNode } from 'react';
import { ModalContext, type ModalContextType } from './ModalContext';

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const confirm = (title: string, message: string): Promise<boolean> => {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  };
  
  const showAlert = (title: string, message: React.ReactNode): Promise<void> => {
    return Promise.resolve(window.alert(`${title}\n\n${message}`));
  };

  const value: ModalContextType = {
    isModalOpen, openModal, closeModal, confirm, showAlert
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
