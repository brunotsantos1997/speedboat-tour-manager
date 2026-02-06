// src/ui/screens/FinanceScreen.tsx
import React from 'react';
import { useFinanceViewModel } from '../../viewmodels/useFinanceViewModel';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { DollarSign, TrendingDown, TrendingUp, BarChart3, Calendar, PlusCircle, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MoneyInput } from '../components/MoneyInput';
import { incomeRepository } from '../../core/repositories/IncomeRepository';
import { useToastContext } from '../contexts/ToastContext';

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; color: string }> = ({ title, value, subValue, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export const FinanceScreen: React.FC = () => {
  const { loading, stats, cashFlowData, startDate, setStartDate, endDate, setEndDate, refresh } = useFinanceViewModel();
  const { showToast } = useToastContext();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = React.useState(false);
  const [incomeAmount, setIncomeAmount] = React.useState(0);
  const [incomeDesc, setIncomeDesc] = React.useState('');
  const [incomeDate, setIncomeDate] = React.useState(new Date().toISOString().split('T')[0]);

  const handleAddIncome = async () => {
    if (!incomeDesc || incomeAmount <= 0) return;
    try {
        await incomeRepository.add({
            description: incomeDesc,
            amount: incomeAmount,
            date: incomeDate,
            paymentMethod: 'PIX',
            timestamp: Date.now()
        });
        showToast('Receita avulsa registrada!');
        setIsIncomeModalOpen(false);
        setIncomeAmount(0);
        setIncomeDesc('');
        refresh();
    } catch (e) {
        showToast('Erro ao salvar receita.');
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando dados financeiros...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-500">Acompanhe a saúde financeira do seu negócio</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle size={20} />
            <span>Ganhos Avulsos</span>
          </button>
          <Link to="/expenses" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusCircle size={20} />
            <span>Lançar Despesa</span>
          </Link>
          <Link to="/expense-categories" className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Categorias">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Calendar size={18} className="text-gray-400" />
          <span>Período:</span>
        </div>
        <input
          type="date"
          value={startDate.toISOString().split('T')[0]}
          onChange={(e) => setStartDate(new Date(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">até</span>
        <input
          type="date"
          value={endDate.toISOString().split('T')[0]}
          onChange={(e) => setEndDate(new Date(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={formatCurrencyBRL(stats.totalRevenue)}
          subValue={`${stats.eventCount} recebimentos`}
          icon={<TrendingUp className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Despesas Totais"
          value={formatCurrencyBRL(stats.totalExpenses)}
          subValue={`${stats.expenseCount} lançamentos`}
          icon={<TrendingDown className="text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrencyBRL(stats.netProfit)}
          subValue={`Margem: ${stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%`}
          icon={<DollarSign className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Média por Passeio"
          value={formatCurrencyBRL(stats.eventCount > 0 ? stats.totalRevenue / stats.eventCount : 0)}
          icon={<BarChart3 className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Origem da Receita</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Aluguel de Lanchas</span>
                <span className="font-bold">{formatCurrencyBRL(stats.boatRentalRevenue)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${stats.totalRevenue > 0 ? (stats.boatRentalRevenue / stats.totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Produtos e Serviços</span>
                <span className="font-bold">{formatCurrencyBRL(stats.productsRevenue)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-purple-500 h-2.5 rounded-full"
                  style={{ width: `${stats.totalRevenue > 0 ? (stats.productsRevenue / stats.totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Ganhos Avulsos</span>
                <span className="font-bold">{formatCurrencyBRL(stats.otherRevenue)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${stats.totalRevenue > 0 ? (stats.otherRevenue / stats.totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 leading-relaxed">
              O aluguel representa <strong>{stats.totalRevenue > 0 ? ((stats.boatRentalRevenue / stats.totalRevenue) * 100).toFixed(0) : 0}%</strong> do seu faturamento no período.
            </p>
          </div>
        </div>

        {/* Cash Flow Chart (Simple implementation) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa (Últimos 6 meses)</h2>
          <div className="flex items-end justify-between h-64 gap-2 pt-4">
            {cashFlowData.map((data, index) => {
                const max = Math.max(...cashFlowData.map(d => Math.max(d.revenue, d.expenses)), 100);
                const revHeight = (data.revenue / max) * 100;
                const expHeight = (data.expenses / max) * 100;

                return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                            <div
                                className="w-3 sm:w-6 bg-green-500 rounded-t-sm"
                                style={{ height: `${revHeight}%` }}
                                title={`Receita: ${formatCurrencyBRL(data.revenue)}`}
                            ></div>
                            <div
                                className="w-3 sm:w-6 bg-red-400 rounded-t-sm"
                                style={{ height: `${expHeight}%` }}
                                title={`Despesa: ${formatCurrencyBRL(data.expenses)}`}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{data.month}</span>
                    </div>
                )
            })}
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Receita</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-xs text-gray-600">Despesa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">Registrar Ganho Avulso</h2>
                    <button onClick={() => setIsIncomeModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Ex: Venda de Isca, Taxa Extra..."
                            value={incomeDesc}
                            onChange={e => setIncomeDesc(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                        <MoneyInput value={incomeAmount} onChange={setIncomeAmount} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-lg outline-none"
                            value={incomeDate}
                            onChange={e => setIncomeDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsIncomeModalOpen(false)} className="flex-1 py-2 text-gray-600 font-medium">Cancelar</button>
                    <button
                        onClick={handleAddIncome}
                        disabled={!incomeDesc || incomeAmount <= 0}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
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
