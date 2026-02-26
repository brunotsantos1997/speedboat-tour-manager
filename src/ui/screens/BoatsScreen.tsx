// src/ui/screens/BoatsScreen.tsx
import React from 'react';
import { useBoatsViewModel } from '../../viewmodels/useBoatsViewModel';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { useModalContext } from '../contexts/ModalContext';
import { Plus, Edit, Trash2, Anchor, Users, Ruler } from 'lucide-react';
import type { Boat } from '../../core/domain/types';
import { MoneyInput } from '../components/MoneyInput';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { Tutorial } from '../components/Tutorial';
import { boatsSteps } from '../tutorials/boatsSteps';

// --- Components ---

const BoatModal: React.FC<{
  isOpen: boolean;
  boat: Partial<Boat> | null;
  onSave: () => void;
  onClose: () => void;
  onUpdate: (field: keyof Boat, value: any) => void;
}> = ({ isOpen, boat, onSave, onClose, onUpdate }) => {
  if (!isOpen || !boat) return null;

  const isNew = !boat.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-black mb-6 text-gray-900 border-b pb-4">{isNew ? 'Adicionar Nova Lancha' : 'Editar Lancha'}</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="boat-name" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Nome da Lancha</label>
            <input id="boat-name" type="text" placeholder="Ex: Focker 300" value={boat.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="boat-capacity" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider text-[10px]">Capacidade (pess.)</label>
              <input id="boat-capacity" type="number" placeholder="Capacidade" value={boat.capacity} onChange={(e) => onUpdate('capacity', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
            </div>
            <div>
              <label htmlFor="boat-size" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider text-[10px]">Tamanho (pés)</label>
              <input id="boat-size" type="number" placeholder="Tamanho" value={boat.size} onChange={(e) => onUpdate('size', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <MoneyInput id="boat-price-hour" label="Preço/Hora (Venda)" value={boat.pricePerHour || 0} onChange={(val) => onUpdate('pricePerHour', val)} />
            <MoneyInput id="boat-cost-hour" label="Custo/Hora (Operac.)" value={boat.costPerHour || 0} onChange={(val) => onUpdate('costPerHour', val)} />
            <MoneyInput id="boat-price-half-hour" label="Preço 30min (Venda)" value={boat.pricePerHalfHour || 0} onChange={(val) => onUpdate('pricePerHalfHour', val)} />
            <MoneyInput id="boat-cost-half-hour" label="Custo 30min (Operac.)" value={boat.costPerHalfHour || 0} onChange={(val) => onUpdate('costPerHalfHour', val)} />
          </div>

          <div>
            <label htmlFor="boat-org-time" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Tempo de Organização (minutos)</label>
            <input id="boat-org-time" type="number" placeholder="Ex: 30" value={boat.organizationTimeMinutes} onChange={(e) => onUpdate('organizationTimeMinutes', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-10">
          <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={onSave} className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">Salvar Lancha</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---

export const BoatsScreen: React.FC = () => {
  const vm = useBoatsViewModel();
  const { currentUser } = useAuth();
  const { showToast } = useToastContext();
  const { confirm } = useModalContext();
  const isAuthorized = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const handleSave = async () => {
    const result = await vm.handleSave();
    if (result && !result.success) {
      showToast(result.error || 'Erro ao salvar lancha.');
    } else {
      showToast('Lancha salva com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Confirmar Exclusão', 'Tem certeza de que deseja excluir esta embarcação? Esta ação não pode ser desfeita.')) {
        const result = await vm.confirmDeleteExternal(id);
        if (result && !result.success) {
            showToast(result.error || 'Erro ao excluir lancha.');
        } else {
            showToast('Lancha excluída com sucesso!');
        }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Tutorial tourId="boats" steps={boatsSteps} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Configurar Lanchas</h1>
          <p className="text-gray-500">Gerencie sua frota de embarcações</p>
        </div>
        {isAuthorized && (
          <button onClick={vm.openNewBoatModal} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95" data-tour="btn-add-boat">
            <Plus size={20} className="mr-2" />
            Adicionar Lancha
          </button>
        )}
      </div>

      {vm.isLoading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-tour="boats-list">
          <ul className="divide-y divide-gray-100">
            {vm.boats.length > 0 ? vm.boats.map((boat) => (
              <li key={boat.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Anchor size={28} />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 text-xl leading-tight">{boat.name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center text-sm font-medium text-gray-500">
                            <Users size={16} className="mr-1.5 opacity-60" />
                            <span>{boat.capacity} passageiros</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-gray-500">
                            <Ruler size={16} className="mr-1.5 opacity-60" />
                            <span>{boat.size} pés</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">
                            {formatCurrencyBRL(boat.pricePerHour || 0)}/h
                        </span>
                        <span className="text-[10px] font-black bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-widest border border-gray-100">
                            {formatCurrencyBRL(boat.pricePerHalfHour || 0)}/30min
                        </span>
                    </div>
                  </div>
                </div>
                {isAuthorized && (
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button onClick={() => vm.openEditBoatModal(boat)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar" data-tour="btn-edit-boat">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => handleDelete(boat.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </li>
            )) : (
                <li className="p-12 text-center text-gray-500">
                    <Anchor size={48} className="mx-auto text-gray-200 mb-3" />
                    <p>Nenhuma lancha cadastrada.</p>
                </li>
            )}
          </ul>
        </div>
      )}

      <BoatModal
        isOpen={vm.isModalOpen}
        boat={vm.editingBoat}
        onSave={handleSave}
        onClose={vm.closeModal}
        onUpdate={vm.updateEditingBoat}
      />
    </div>
  );
};
