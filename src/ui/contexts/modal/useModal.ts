import { useContext } from 'react';
import { ModalContext } from './ModalContext';

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) throw new Error('useModal deve ser usado dentro de um ModalProvider');
  return context;
};
