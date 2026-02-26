// src/ui/screens/ExpensesScreen.tsx
import React, { useState } from 'react';
import { useExpenseViewModel } from '../../viewmodels/useExpenseViewModel';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { Plus, Trash2, Pencil, Anchor, Tag } from 'lucide-react';
import { MoneyInput } from '../components/MoneyInput';
import { useModalContext } from '../contexts/ModalContext';

export const ExpensesScreen: React.FC = () => {
  const { showAlert } = useModalContext();
  const { expenses, categories, boats, loading, addExpense, updateExpense, removeExpense } = useExpenseViewModel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [boatId, setBoatId] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'PAID'>('PAID');

  const handleOpenModal = (expense?: any) => {
    if (expense) {
      setEditingExpenseId(expense.id);
      setDescription(expense.description);
      setAmount(expense.amount);
      setDate(expense.date);
      setCategoryId(expense.categoryId);
      setBoatId(expense.boatId || '');
      setStatus(expense.status);
    } else {
      setEditingExpenseId(null);
      setDescription('');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(categories[0]?.id || '');
      setBoatId('');
      setStatus('PAID');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!description || amount <= 0 || !categoryId || !date) {
      await showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const data = { description, amount, date, categoryId, boatId, status };

    if (editingExpenseId) {
      await updateExpense({ ...data, id: editingExpenseId } as any);
    } else {
      await addExpense(data as any);
    }
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-8 text-center">Carregando despesas...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-500">Gerencie os custos da sua operação</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Barco</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length > 0 ? expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Tag size={12} />
                      {expense.categoryName || 'S/ Cat'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {expense.boatName ? (
                      <div className="flex items-center gap-1.5">
                        <Anchor size={14} className="text-blue-500" />
                        {expense.boatName}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrencyBRL(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      expense.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {expense.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => handleOpenModal(expense)} className="text-gray-400 hover:text-blue-600 mr-3">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => removeExpense(expense.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 italic">
                        Nenhuma despesa registrada.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold mb-6">{editingExpenseId ? 'Editar Despesa' : 'Nova Despesa'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Combustível, Gelo, Faxina..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                <MoneyInput value={amount} onChange={setAmount} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white outline-none"
                  >
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barco (Opcional)</label>
                <select
                  value={boatId}
                  onChange={(e) => setBoatId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white outline-none"
                >
                  <option value="">Nenhum barco específico</option>
                  {boats.map(boat => (
                    <option key={boat.id} value={boat.id}>{boat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
