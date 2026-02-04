// src/ui/components/CustomTimePicker.tsx
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { TimePickerModal } from './TimePickerModal';

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all text-gray-700"
      >
        <span className="font-medium">{value}</span>
        <Clock size={18} className="text-gray-400" />
      </button>
      <TimePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTimeSelect={handleTimeSelect}
        initialTime={value}
      />
    </>
  );
};
