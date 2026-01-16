// src/ui/components/Toast.tsx
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
      {message}
    </div>
  );
};
