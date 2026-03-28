// src/ui/components/EndTimePicker.tsx
import React, { useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface EndTimeOption {
  time: string;
  date: Date;
}

interface EndTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  options: EndTimeOption[];
  disabled?: boolean;
  selectedDate?: Date;
}

export const EndTimePicker: React.FC<EndTimePickerProps> = ({ value, onChange, options, disabled, selectedDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (time: string) => {
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
        <span className="font-medium">{value || 'Selecione'}</span>
        <Clock size={18} className="text-gray-400" />
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-center text-gray-800">Horário de Término</h2>
              <p className="text-sm text-gray-500 text-center mt-1">Múltiplos de 30 minutos</p>
            </div>

            <div className="flex-grow overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => (
                  <button
                    key={`${opt.date.getTime()}-${opt.time}`}
                    type="button"
                    onClick={() => handleSelect(opt.time)}
                    className={`p-3 rounded-xl text-center font-medium transition-all relative ${
                      value === opt.time && selectedDate && format(opt.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-blue-50 text-gray-700 border border-transparent hover:border-blue-200'
                    }`}
                  >
                    <div className="flex flex-col">
                        <span>{opt.time}</span>
                        {selectedDate && format(opt.date, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd') && (
                            <span className="text-[10px] opacity-80 flex items-center justify-center">
                                <Calendar size={10} className="mr-0.5" />
                                {format(opt.date, 'dd/MM')}
                            </span>
                        )}
                    </div>
                  </button>
                ))}
              </div>
              {options.length === 0 && (
                <p className="text-center py-8 text-gray-500">Nenhum horário disponível.</p>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
