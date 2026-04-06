import { createContext } from 'react';

export interface ModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  confirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: React.ReactNode) => Promise<void>;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
