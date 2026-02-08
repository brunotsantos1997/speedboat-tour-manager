// src/ui/screens/CommissionReportScreen.tsx
import React, { useState } from 'react';
import { useCommissionReportViewModel } from '../../viewmodels/useCommissionReportViewModel';
import { DayPicker } from 'react-day-picker';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, DollarSign, X } from 'lucide-react';
import type { CommissionReportEntry, PaymentMethod } from '../../core/domain/types';
import { useToastContext } from '../contexts/ToastContext';

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
    payCommission,
  } = useCommissionReportViewModel();
  const { showToast } = useToastContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CommissionReportEntry | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');

  const handlePayClick = (entry: CommissionReportEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedEntry) return;
    try {
      await payCommission(selectedEntry, paymentMethod);
      showToast('Pagamento de comissão registrado!');
      setIsModalOpen(false);
      setSelectedEntry(null);
    } catch (e) {
      showToast('Erro ao registrar pagamento.');
    }
  };

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
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Data</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 text-right">Valor Barco</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 text-center">Comissão</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 text-right">Valor</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 text-center">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map(entry => (
                  <tr key={entry.eventId} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{entry.userName}</td>
                    <td className="p-3">{entry.clientName}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(entry.eventDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-right">{formatCurrencyBRL(entry.rentalRevenue)}</td>
                    <td className="p-3 text-center">{entry.commissionPercentage}%</td>
                    <td className="p-3 text-right font-bold text-green-600">{formatCurrencyBRL(entry.commissionValue)}</td>
                    <td className="p-3 text-center">
                      {entry.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                          <CheckCircle size={14} /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold uppercase">
                          <Clock size={14} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {entry.status === 'PENDING' && (
                        <button
                          onClick={() => handlePayClick(entry)}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                          title="Pagar Comissão"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                    </td>
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
                <td colSpan={5} className="p-3 text-right">Total Pendente:</td>
                <td className="p-3 text-right text-amber-600">
                  {formatCurrencyBRL(reportData.filter(e => e.status === 'PENDING').reduce((acc, entry) => acc + entry.commissionValue, 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-t">
                <td colSpan={5} className="p-3 text-right">Total Geral:</td>
                <td className="p-3 text-right">
                  {formatCurrencyBRL(reportData.reduce((acc, entry) => acc + entry.commissionValue, 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">Pagar Comissão</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Pagamento para:</p>
                        <p className="text-lg font-bold text-gray-900">{selectedEntry?.userName}</p>
                        <div className="flex justify-between mt-2 pt-2 border-t border-blue-100">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="text-lg font-bold text-blue-700">{formatCurrencyBRL(selectedEntry?.commissionValue || 0)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="PIX">PIX</option>
                            <option value="CASH">Dinheiro</option>
                            <option value="TRANSFER">Transferência</option>
                            <option value="CARD_DEBIT">Cartão de Débito</option>
                            <option value="OTHER">Outros</option>
                        </select>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 font-medium">Cancelar</button>
                    <button
                        onClick={confirmPayment}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md"
                    >
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
  );
};
