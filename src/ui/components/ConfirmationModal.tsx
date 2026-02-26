import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onCancel, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full transform animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-50 rounded-2xl text-red-600 mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black mb-3 text-gray-900">{title}</h2>
          <p className="mb-8 text-gray-500 font-medium leading-relaxed">{message}</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
