// src/ui/screens/CompanyDataScreen.tsx
import React, { useState, useEffect } from 'react';
import type { DayOfWeek } from '../../core/domain/types';
import { useCompanyDataViewModel } from '../../viewmodels/CompanyDataViewModel';
import { useToastContext } from '../contexts/ToastContext';
import { CustomTimePicker } from '../components/CustomTimePicker';

const weekDays: { key: DayOfWeek; label: string }[] = [
  { key: 'sunday', label: 'Domingo' },
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
];

export const CompanyDataScreen: React.FC = () => {
  const { companyData, isLoading, error, updateCompanyData } = useCompanyDataViewModel();
  const [formData, setFormData] = useState(companyData);
  const { showToast } = useToastContext();

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
    }
  }, [companyData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => (prev ? { ...prev, [name]: val } : null));
  };

  const handleBusinessHoursChange = (
    day: DayOfWeek,
    field: 'startTime' | 'endTime' | 'isClosed',
    value: string | boolean,
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updatedBusinessHours = { ...prev.businessHours };
      updatedBusinessHours[day] = { ...updatedBusinessHours[day], [field]: value };
      return { ...prev, businessHours: updatedBusinessHours };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    try {
      await updateCompanyData(formData);
      showToast('Dados da empresa atualizados com sucesso!');
    } catch (err) {
      showToast('Erro ao atualizar os dados da empresa.');
    }
  };

  if (isLoading || !formData) {
    return <div className="p-6">Carregando...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dados da Empresa</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="appName" className="block text-lg font-medium text-gray-700">
                Título da Aplicação
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                value={formData.appName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="cnpj" className="block text-lg font-medium text-gray-700">
                CNPJ
              </label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-lg font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="reservationFeePercentage" className="block text-lg font-medium text-gray-700">
                Percentual do Sinal de Reserva (%)
              </label>
              <input
                type="number"
                id="reservationFeePercentage"
                name="reservationFeePercentage"
                value={formData.reservationFeePercentage}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="eventIntervalMinutes"
                className="block text-lg font-medium text-gray-700"
              >
                Intervalo Mínimo entre Eventos (minutos)
              </label>
              <input
                type="number"
                id="eventIntervalMinutes"
                name="eventIntervalMinutes"
                value={formData.eventIntervalMinutes}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Horário de Funcionamento</h2>
            <div className="space-y-4 mt-4">
              {weekDays.map(({ key, label }) => (
                <div
                  key={key}
                  className="grid grid-cols-1 lg:grid-cols-4 items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700 lg:col-span-1">{label}</span>
                  <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                    <CustomTimePicker
                      value={formData.businessHours[key].startTime}
                      onChange={(value) => handleBusinessHoursChange(key, 'startTime', value)}
                      disabled={formData.businessHours[key].isClosed}
                    />
                    <CustomTimePicker
                      value={formData.businessHours[key].endTime}
                      onChange={(value) => handleBusinessHoursChange(key, 'endTime', value)}
                      disabled={formData.businessHours[key].isClosed}
                    />
                  </div>
                  <div className="flex items-center gap-2 lg:col-span-1 lg:justify-self-end">
                    <label htmlFor={`closed-${key}`} className="text-gray-600">
                      Fechado
                    </label>
                    <input
                      type="checkbox"
                      id={`closed-${key}`}
                      checked={formData.businessHours[key].isClosed}
                      onChange={(e) => handleBusinessHoursChange(key, 'isClosed', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-right">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
