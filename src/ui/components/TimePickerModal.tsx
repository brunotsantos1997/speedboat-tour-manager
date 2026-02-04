
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
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex justify-center items-center transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Selecione o Horário</h2>

        <div className="relative flex justify-center items-center gap-2 h-48 overflow-hidden bg-gray-50 rounded-xl border border-gray-100">
          {/* Selection Highlight */}
          <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-blue-50 border-y border-blue-100 pointer-events-none"></div>

          {/* Fading Effects */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none"></div>

          {/* Hours Column */}
          <div ref={hoursRef} className="w-20 h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-[72px] z-0">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={`hour-${i}`}
                className="flex items-center justify-center h-12 text-xl font-medium text-gray-700 snap-center"
              >
                {String(i).padStart(2, '0')}
              </div>
            ))}
          </div>

          <div className="text-2xl font-bold text-gray-400 z-0">:</div>

          {/* Minutes Column */}
          <div ref={minutesRef} className="w-20 h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-[72px] z-0">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={`minute-${i}`}
                className="flex items-center justify-center h-12 text-xl font-medium text-gray-700 snap-center"
              >
                {String(i).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleTimeSelect}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
