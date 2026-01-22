
import React, { useRef, useEffect } from 'react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  initialTime: string;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  onTimeSelect,
  initialTime,
}) => {
  const [hour, minute] = initialTime.split(':').map(Number);

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (hoursRef.current) {
        const itemHeight = (hoursRef.current.children[0] as HTMLDivElement).offsetHeight;
        hoursRef.current.scrollTop = hour * itemHeight;
      }
      if (minutesRef.current) {
        const itemHeight = (minutesRef.current.children[0] as HTMLDivElement).offsetHeight;
        minutesRef.current.scrollTop = minute * itemHeight;
      }
    }
  }, [isOpen, hour, minute]);

  if (!isOpen) {
    return null;
  }

  const handleTimeSelect = () => {
    let selectedHour = 0;
    if (hoursRef.current) {
      const { scrollTop, children } = hoursRef.current;
      const itemHeight = (children[0] as HTMLDivElement).offsetHeight;
      selectedHour = Math.round(scrollTop / itemHeight);
    }

    let selectedMinute = 0;
    if (minutesRef.current) {
      const { scrollTop, children } = minutesRef.current;
      const itemHeight = (children[0] as HTMLDivElement).offsetHeight;
      selectedMinute = Math.round(scrollTop / itemHeight);
    }

    onTimeSelect(
      `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xs mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-center mb-4">Selecione o Horário</h2>
        <div className="flex justify-center items-center gap-4 h-48 overflow-hidden">
          {/* Hours Column */}
          <div ref={hoursRef} className="w-1/2 h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-[72px]">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={`hour-${i}`}
                className="flex items-center justify-center h-12 text-lg snap-center"
              >
                {String(i).padStart(2, '0')}
              </div>
            ))}
          </div>
          <div className="text-xl">:</div>
          {/* Minutes Column */}
          <div ref={minutesRef} className="w-1/2 h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-[72px]">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={`minute-${i}`}
                className="flex items-center justify-center h-12 text-lg snap-center"
              >
                {String(i).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleTimeSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
