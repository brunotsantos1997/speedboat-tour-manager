// src/ui/components/EventCostModal.tsx
import React from 'react';
import { MoneyInput } from './MoneyInput';
import { Save, X, Info, Plus, Trash2 } from 'lucide-react';
import type { EventType, SelectedProduct, EventCostItem } from '../../core/domain/types';

interface EventCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  event: EventType | null;
  rentalCost: number;
  setRentalCost: (val: number) => void;
  products: SelectedProduct[];
  updateProductCost: (id: string, cost: number) => void;
  additionalCosts: EventCostItem[];
  addAdditionalCost: () => void;
  updateAdditionalCost: (id: string, updates: Partial<EventCostItem>) => void;
  removeAdditionalCost: (id: string) => void;
  isSaving: boolean;
}

export const EventCostModal: React.FC<EventCostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  rentalCost,
  setRentalCost,
  products,
  updateProductCost,
  additionalCosts,
  addAdditionalCost,
  updateAdditionalCost,
  removeAdditionalCost,
  isSaving
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="bg-gray-50 p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Custos do Passeio</h2>
            <p className="text-sm text-gray-500">{event.boat.name} - {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-8">
          <div className="bg-blue-50 p-4 rounded-lg flex gap-3 border border-blue-100">
            <Info className="text-blue-600 shrink-0" size={20} />
            <p className="text-sm text-blue-800">
              Defina os custos operacionais deste passeio. Estes valores serão abatidos da base de comissão (se configurado) e registrados como despesas no Livro Caixa.
            </p>
          </div>

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">Aluguel da Lancha</h3>
            <MoneyInput
              label="Custo Operacional da Lancha"
              value={rentalCost}
              onChange={setRentalCost}
              placeholder="Ex: Valor pago ao marinheiro + combustível"
            />
          </section>

          {products.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-purple-600 pl-3">Produtos e Extras</h3>
              <div className="space-y-4">
                {products.map(p => (
                  <div key={p.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{p.pricingType}</p>
                    </div>
                    <MoneyInput
                      label="Custo do Item"
                      value={p.snapshotCost || 0}
                      onChange={(val) => updateProductCost(p.id, val)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex justify-between items-center mb-4 border-l-4 border-orange-600 pl-3">
              <h3 className="text-lg font-bold text-gray-800">Custos Adicionais</h3>
              <button
                onClick={addAdditionalCost}
                className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-bold"
              >
                <Plus size={16} />
                Adicionar Custo
              </button>
            </div>

            <div className="space-y-4">
              {additionalCosts.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateAdditionalCost(item.id, { name: e.target.value })}
                        placeholder="Ex: Marinheiro, Gelo, Taxa Marina..."
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria (p/ Comissão)</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateAdditionalCost(item.id, { category: e.target.value as any })}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium bg-white"
                      >
                        <option value="RENTAL">Passeio (Barco)</option>
                        <option value="PRODUCT">Produtos</option>
                        <option value="TAX">Taxas</option>
                        <option value="OTHER">Outros (Geral)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <MoneyInput
                        label="Valor do Custo"
                        value={item.amount}
                        onChange={(val) => updateAdditionalCost(item.id, { amount: val })}
                      />
                    </div>
                    <button
                      onClick={() => removeAdditionalCost(item.id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover Custo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {additionalCosts.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-sm text-gray-400 font-medium">Nenhum custo adicional registrado.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-shadow shadow-md font-bold disabled:bg-blue-400"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : (
              <>
                <Save size={20} />
                Salvar Custos
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
