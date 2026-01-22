// src/ui/components/CustomTimePicker.tsx
import React, { useState } from 'react';
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
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 text-center"
      >
        {value}
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
