// src/ui/screens/CompanyDataScreen.tsx
import React, { useState, useEffect } from 'react';
import { useCompanyDataViewModel } from '../../viewmodels/CompanyDataViewModel';
import { useToastContext } from '../contexts/ToastContext';

export const CompanyDataScreen: React.FC = () => {
  const { companyData, isLoading, error, updateCompanyData } = useCompanyDataViewModel();
  const [formData, setFormData] = useState({
    cnpj: '',
    phone: '',
    appName: '',
  });
  const { showToast } = useToastContext();

  useEffect(() => {
    if (companyData) {
      setFormData({
        cnpj: companyData.cnpj,
        phone: companyData.phone,
        appName: companyData.appName,
      });
    }
  }, [companyData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompanyData(formData);
      showToast('Dados da empresa atualizados com sucesso!');
    } catch (err) {
      showToast('Erro ao atualizar os dados da empresa.');
    }
  };

  if (isLoading) {
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
