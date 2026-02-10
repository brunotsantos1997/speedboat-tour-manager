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
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">Dados da Empresa</h1>
            <p className="text-gray-500">Configure as informações públicas e regras de negócio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="appName" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Nome do Negócio
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                value={formData.appName}
                onChange={handleChange}
                placeholder="Ex: Dilancha Náutica"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
              />
            </div>
            <div>
              <label htmlFor="cnpj" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                CNPJ
              </label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+55 (21) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="reservationFeePercentage" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Percentual do Sinal de Reserva (%)
              </label>
              <div className="relative">
                <input
                    type="number"
                    id="reservationFeePercentage"
                    name="reservationFeePercentage"
                    value={formData.reservationFeePercentage}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="mt-2 text-xs text-gray-400 font-medium italic">Este valor será sugerido como sinal mínimo para garantir a reserva do passeio.</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Horário de Funcionamento</h2>
            <div className="space-y-3">
              {weekDays.map(({ key, label }) => (
                <div
                  key={key}
                  className={`grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4 rounded-xl border transition-all ${
                      formData.businessHours[key].isClosed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <span className="font-bold text-gray-700 md:col-span-1">{label}</span>
                  <div className="grid grid-cols-2 gap-3 md:col-span-2">
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
                  <div className="flex items-center gap-2 md:col-span-1 md:justify-end">
                    <label htmlFor={`closed-${key}`} className="text-xs font-bold text-gray-500 uppercase cursor-pointer">
                      {formData.businessHours[key].isClosed ? 'Fechado' : 'Aberto'}
                    </label>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                        type="checkbox"
                        id={`closed-${key}`}
                        checked={formData.businessHours[key].isClosed}
                        onChange={(e) => handleBusinessHoursChange(key, 'isClosed', e.target.checked)}
                        className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95 text-lg"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
