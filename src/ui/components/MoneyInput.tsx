import React, { useState, useEffect } from 'react';
import { formatNumberBRL } from '../../core/utils/currencyUtils';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label,
  id,
  placeholder,
  className,
  disabled
}) => {
  const [displayValue, setDisplayValue] = useState(formatNumberBRL(value));

  useEffect(() => {
    setDisplayValue(formatNumberBRL(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const digits = e.target.value.replace(/\D/g, '');

    // Convert to number (treating last two digits as cents)
    const numericValue = parseFloat(digits) / 100;

    onChange(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus to make it easier to replace the entire value
    e.target.select();
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          R$
        </span>
        <input
          type="text"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${className || ''}`}
        />
      </div>
    </div>
  );
};
