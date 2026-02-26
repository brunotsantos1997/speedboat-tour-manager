import React from 'react';
import { Info } from 'lucide-react';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
}

export const InformationModal: React.FC<InformationModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full transform animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mb-6">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-black mb-3 text-gray-900">{title}</h2>
          <div className="mb-8 text-gray-500 font-medium leading-relaxed select-text">
            {message}
          </div>
          <div className="w-full">
            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
