// src/ui/screens/CashBookScreen.tsx
import React from 'react';
import { useCashBookViewModel } from '../../viewmodels/useCashBookViewModel';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { Search, Calendar, Filter, ArrowUpCircle, ArrowDownCircle, Trash2, Anchor, Tag, Layers, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const CashBookScreen: React.FC = () => {
  const {
    loading,
    isDeleting,
    boats,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterBoatId,
    setFilterBoatId,
    filterCategory,
    setFilterCategory,
    cashBook,
    deleteEntry
  } = useCashBookViewModel();

  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center">Carregando livro caixa...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livro Caixa</h1>
          <p className="text-gray-500">Histórico detalhado e filtros avançados</p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="flex flex-col sm:flex-row items-center gap-2 lg:col-span-2">
             <div className="flex items-center gap-2 w-full">
                <Calendar size={18} className="text-gray-400 shrink-0" />
                <input
                    type="date"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setStartDate(new Date(y, m - 1, d));
                    }}
                />
                <span className="text-gray-400">até</span>
                <input
                    type="date"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setEndDate(new Date(y, m - 1, d));
                    }}
                />
             </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
            >
                <option value="ALL">Todos os Tipos</option>
                <option value="ENTRANCE">Entradas</option>
                <option value="EXIT">Saídas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Boat Filter */}
            <div className="relative">
                <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm bg-white"
                    value={filterBoatId}
                    onChange={(e) => setFilterBoatId(e.target.value)}
                >
                    <option value="ALL">Todas as Lanchas</option>
                    {boats.map(boat => (
                        <option key={boat.id} value={boat.id}>{boat.name}</option>
                    ))}
                </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm bg-white"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="ALL">Todas as Categorias</option>
                    <option value="BOAT">Apenas Lancha (Passeio)</option>
                    <option value="PRODUCT">Apenas Produtos</option>
                    <option value="TAX">Apenas Taxas</option>
                    <option value="EXPENSE">Despesas</option>
                    <option value="INCOME">Ganhos Avulsos</option>
                </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end text-sm text-gray-500 italic">
                {cashBook.length} registros encontrados
            </div>
        </div>
      </div>

      {/* Desktop Table Area */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider font-semibold border-b">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashBook.length > 0 ? cashBook.map((entry) => (
                <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${entry.isCancelled ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <p className={`font-medium text-gray-800 ${entry.isCancelled ? 'line-through' : ''}`}>
                            {entry.description}
                        </p>
                        {entry.isCancelled && <span className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-0.5">Estornado (Cancelado)</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                        {entry.type === 'EXPENSE' ? 'Despesa' : entry.type === 'INCOME' ? 'Ganho Avulso' : 'Pagamento Cliente'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        entry.isCancelled ? 'bg-gray-100 text-gray-500' : (entry.type === 'EXPENSE' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')
                    }`}>
                        {entry.type === 'EXPENSE' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>}
                        {entry.subType === 'BOAT' ? 'Lancha' : entry.subType === 'PRODUCT' ? 'Produto' : entry.subType === 'TAX' ? 'Taxa' : 'Geral'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${entry.isCancelled ? 'text-gray-400 line-through' : (entry.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600')}`}>
                    {entry.type === 'EXPENSE' ? '-' : '+'} {formatCurrencyBRL(entry.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => deleteEntry(entry.id, entry.type)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                      disabled={isDeleting}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                        <Layers size={48} className="text-gray-200" />
                        <p>Nenhum registro encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {cashBook.length > 0 ? cashBook.map((entry) => (
          <div key={entry.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 ${entry.isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-gray-500 font-medium">
                   {new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </span>
                <p className={`font-bold text-gray-900 mt-0.5 ${entry.isCancelled ? 'line-through' : ''}`}>{entry.description}</p>
                {entry.isCancelled && <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Estornado (Cancelado)</p>}
              </div>
              <button
                onClick={() => deleteEntry(entry.id, entry.type)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                disabled={isDeleting}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex justify-between items-center mt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                   entry.isCancelled ? 'bg-gray-100 text-gray-500' : (entry.type === 'EXPENSE' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')
              }`}>
                  {entry.subType === 'BOAT' ? 'Lancha' : entry.subType === 'PRODUCT' ? 'Produto' : entry.subType === 'TAX' ? 'Taxa' : 'Geral'}
              </span>
              <p className={`text-lg font-black ${entry.isCancelled ? 'text-gray-400 line-through' : (entry.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600')}`}>
                {entry.type === 'EXPENSE' ? '-' : '+'} {formatCurrencyBRL(entry.amount)}
              </p>
            </div>

            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight border-t pt-2">
                {entry.type === 'EXPENSE' ? 'Despesa' : entry.type === 'INCOME' ? 'Ganho Avulso' : 'Pagamento Cliente'}
            </p>
          </div>
        )) : (
          <div className="bg-white p-12 rounded-xl text-center text-gray-500 border border-dashed">
             <Layers size={40} className="mx-auto text-gray-200 mb-2" />
             <p>Nenhum registro encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
