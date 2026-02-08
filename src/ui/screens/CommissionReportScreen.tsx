// src/ui/screens/CommissionReportScreen.tsx
import React from 'react';
import { useCommissionReportViewModel } from '../../viewmodels/useCommissionReportViewModel';
import { DayPicker } from 'react-day-picker';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';

export const CommissionReportScreen: React.FC = () => {
  const {
    reportData,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedUserId,
    setSelectedUserId,
    usersForFilter,
    currentUser,
  } = useCommissionReportViewModel();

  if (loading) {
    return <p>Carregando relatório...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erro: {error}</p>;
  }

  if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="mt-2">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Relatório de Comissão</h1>

      {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <DayPicker
              id="startDate"
              mode="single"
              selected={startDate}
              onSelect={(day: Date | undefined) => day && setStartDate(day)}
              locale={ptBR}
              className="bg-white p-2 border rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <DayPicker
              id="endDate"
              mode="single"
              selected={endDate}
              onSelect={(day: Date | undefined) => day && setEndDate(day)}
              locale={ptBR}
              className="bg-white p-2 border rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Usuário</label>
            <select
              id="userFilter"
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value || undefined)}
              className="w-full p-2 border rounded-md shadow-sm bg-white"
            >
              <option value="">Todos os Usuários</option>
              {usersForFilter.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Usuário</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Data Evento</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Valor Total</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Comissão</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Valor Comissão</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map(entry => (
                  <tr key={entry.eventId} className="border-b hover:bg-gray-50">
                    <td className="p-3">{entry.userName}</td>
                    <td className="p-3">{entry.clientName}</td>
                    <td className="p-3">{new Date(entry.eventDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{formatCurrencyBRL(entry.eventTotalPrice)}</td>
                    <td className="p-3">{entry.commissionPercentage}%</td>
                    <td className="p-3">{formatCurrencyBRL(entry.commissionValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">Nenhum dado encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={5} className="p-3 text-right">Total:</td>
                <td className="p-3">
                  {formatCurrencyBRL(reportData.reduce((acc, entry) => acc + entry.commissionValue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
  );
};
