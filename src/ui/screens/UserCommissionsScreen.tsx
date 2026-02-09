// src/ui/screens/UserCommissionsScreen.tsx
import React, { useState } from 'react';
import { useUserCommissionViewModel } from '../../viewmodels/useUserCommissionViewModel';
import type { User, UserCommissionSettings } from '../../core/domain/User';
import { Toast } from '../components/Toast';
import { Save, User as UserIcon, Percent, Settings2, ChevronLeft } from 'lucide-react';

export const UserCommissionsScreen: React.FC = () => {
  const { users, isLoading, updateCommission } = useUserCommissionViewModel();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<UserCommissionSettings | null>(null);
  const [showFormOnMobile, setShowFormOnMobile] = useState(false);

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setShowFormOnMobile(true);
    setLocalSettings(user.commissionSettings || {
      rentalEnabled: true,
      rentalPercentage: user.commissionPercentage || 0,
      rentalBase: 'NET',
      deductRentalCost: false,
      productEnabled: false,
      productPercentage: 0,
      productBase: 'NET',
      deductProductCost: false,
      taxEnabled: false,
      taxPercentage: 0,
      deductTaxCost: false
    });
  };

  const handleSave = async () => {
    if (!selectedUserId || !localSettings) return;
    try {
      await updateCommission(selectedUserId, localSettings);
      setToastMessage('Configurações de comissão atualizadas!');
    } catch (err) {
      setToastMessage('Erro ao atualizar configurações.');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-blue-600 font-bold">Carregando usuários...</div>;

  return (
    <div className="p-3 md:p-8 bg-gray-50 min-h-screen">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <div className="max-w-6xl mx-auto">
        <header className={`mb-6 md:mb-8 ${showFormOnMobile ? 'hidden md:block' : 'block'}`}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings2 className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
            Comissões por Usuário
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2 font-medium">Defina regras personalizadas para cada membro da equipe.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* User List */}
          <div className={`lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${showFormOnMobile ? 'hidden lg:block' : 'block'}`}>
            <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 uppercase text-xs tracking-widest">Equipe</div>
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] lg:max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedUserId === user.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-gray-900 truncate">{user.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{user.role}</div>
                  </div>
                </button>
              ))}
              {users.length === 0 && <div className="p-8 text-center text-gray-400 italic text-sm">Nenhum membro encontrado.</div>}
            </div>
          </div>

          {/* Commission Settings Form */}
          <div className={`lg:col-span-2 ${showFormOnMobile ? 'block' : 'hidden lg:block'}`}>
            {selectedUser && localSettings ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 md:pb-8">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowFormOnMobile(false)}
                        className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft size={24} className="text-gray-600" />
                      </button>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900">{selectedUser.name}</h2>
                        <p className="text-xs md:text-sm text-gray-500 font-bold">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md md:shadow-sm font-black uppercase tracking-wide text-sm"
                    >
                      <Save size={18} />
                      Salvar Alterações
                    </button>
                  </div>

                  <div className="space-y-6 md:space-y-8 pb-4">
                    {/* Rental Commission */}
                    <section className="p-4 md:p-6 rounded-2xl border border-blue-100 bg-blue-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
                            <Percent size={20} />
                          </div>
                          <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">Passeio (Barco)</h3>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">{localSettings.rentalEnabled ? 'Ativado' : 'Desativado'}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localSettings.rentalEnabled}
                              onChange={e => setLocalSettings({ ...localSettings, rentalEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      {localSettings.rentalEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Porcentagem (%)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={localSettings.rentalPercentage}
                                onChange={e => setLocalSettings({ ...localSettings, rentalPercentage: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-12 py-3 md:py-2.5 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-xl md:text-lg"
                                min="0"
                                max="100"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Base de Cálculo</label>
                                <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, rentalBase: 'GROSS' })}
                                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${localSettings.rentalBase === 'GROSS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Bruto
                                </button>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, rentalBase: 'NET' })}
                                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${localSettings.rentalBase === 'NET' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Líquido
                                </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-blue-300">
                              <input
                                type="checkbox"
                                checked={localSettings.deductRentalCost}
                                onChange={e => setLocalSettings({ ...localSettings, deductRentalCost: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded-md focus:ring-blue-500"
                              />
                              <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                                Abater custos operacionais
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Product Commission */}
                    <section className="p-4 md:p-6 rounded-2xl border border-purple-100 bg-purple-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-600 rounded-lg text-white shrink-0">
                            <Percent size={20} />
                          </div>
                          <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">Produtos (Extras)</h3>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-purple-100">
                           <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">{localSettings.productEnabled ? 'Ativado' : 'Desativado'}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localSettings.productEnabled}
                              onChange={e => setLocalSettings({ ...localSettings, productEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>

                      {localSettings.productEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Porcentagem (%)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={localSettings.productPercentage}
                                onChange={e => setLocalSettings({ ...localSettings, productPercentage: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-12 py-3 md:py-2.5 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all font-black text-xl md:text-lg"
                                min="0"
                                max="100"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Base de Cálculo</label>
                                <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, productBase: 'GROSS' })}
                                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${localSettings.productBase === 'GROSS' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Bruto
                                </button>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, productBase: 'NET' })}
                                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${localSettings.productBase === 'NET' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Líquido
                                </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-purple-300">
                              <input
                                type="checkbox"
                                checked={localSettings.deductProductCost}
                                onChange={e => setLocalSettings({ ...localSettings, deductProductCost: e.target.checked })}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded-md focus:ring-purple-500"
                              />
                              <span className="text-xs font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
                                Abater custos dos produtos
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Tax Commission */}
                    <section className="p-4 md:p-6 rounded-2xl border border-orange-100 bg-orange-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-600 rounded-lg text-white shrink-0">
                            <Percent size={20} />
                          </div>
                          <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">Taxas / Extras</h3>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-orange-100">
                          <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">{localSettings.taxEnabled ? 'Ativado' : 'Desativado'}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localSettings.taxEnabled}
                              onChange={e => setLocalSettings({ ...localSettings, taxEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                        </div>
                      </div>

                      {localSettings.taxEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Porcentagem (%)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={localSettings.taxPercentage}
                                onChange={e => setLocalSettings({ ...localSettings, taxPercentage: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-12 py-3 md:py-2.5 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all font-black text-xl md:text-lg"
                                min="0"
                                max="100"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                            </div>
                          </div>
                        <div className="space-y-4">
                             <p className="text-[10px] md:text-xs text-gray-500 italic font-bold leading-tight mb-2">
                               * Comissionamento sobre o valor de taxas adicionais do passeio.
                             </p>

                             <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-orange-300">
                              <input
                                type="checkbox"
                                checked={localSettings.deductTaxCost}
                                onChange={e => setLocalSettings({ ...localSettings, deductTaxCost: e.target.checked })}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded-md focus:ring-orange-500"
                              />
                              <span className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition-colors">
                                Abater custos das taxas
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <UserIcon size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Selecione um Membro</h3>
                <p className="text-gray-500 font-bold text-sm md:text-base">Escolha alguém da lista para configurar as regras de comissão.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
