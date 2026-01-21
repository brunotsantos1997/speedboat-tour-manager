// src/ui/components/CustomTimePicker.tsx
import React from 'react';

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const generateTimeOptions = (interval: number): string[] => {
  const options: string[] = [];
  for (let i = 0; i < 60; i += interval) {
    options.push(i.toString().padStart(2, '0'));
  }
  return options;
};

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = generateTimeOptions(15); // Intervalo de 15 minutos

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, disabled }) => {
  const [hour, minute] = value.split(':');

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${minute}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${hour}:${e.target.value}`);
  };

  return (
    <div className="flex gap-2">
      <select
        value={hour}
        onChange={handleHourChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="self-center">:</span>
      <select
        value={minute}
        onChange={handleMinuteChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
};
