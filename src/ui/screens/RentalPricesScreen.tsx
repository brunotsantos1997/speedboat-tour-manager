// src/ui/screens/RentalPricesScreen.tsx
import React, { useState, useEffect } from 'react';
import { useRentalPricesViewModel } from '../../viewmodels/useRentalPricesViewModel';
import { useToastContext } from '../../ui/contexts/ToastContext';

export const RentalPricesScreen: React.FC = () => {
  const { prices, isLoading, savePrices } = useRentalPricesViewModel();
  const { showToast } = useToastContext();
  const [hourlyRate, setHourlyRate] = useState(0);
  const [halfHourRate, setHalfHourRate] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setHourlyRate(prices.hourlyRate);
      setHalfHourRate(prices.halfHourRate);
    }
  }, [prices, isLoading]);

  const handleSave = () => {
    savePrices({ hourlyRate, halfHourRate });
    showToast('Preços salvos com sucesso!');
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Preços de Aluguel</h1>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          Salvar Preços
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-6 max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hourlyRate">
            Preço por Hora (R$)
          </label>
          <input
            id="hourlyRate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(parseFloat(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="halfHourRate">
            Preço por Meia Hora (R$)
          </label>
          <input
            id="halfHourRate"
            type="number"
            value={halfHourRate}
            onChange={(e) => setHalfHourRate(parseFloat(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </div>
    </div>
  );
};
