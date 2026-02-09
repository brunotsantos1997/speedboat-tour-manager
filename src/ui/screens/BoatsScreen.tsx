// src/ui/screens/BoatsScreen.tsx
import React from 'react';
import { useBoatsViewModel } from '../../viewmodels/useBoatsViewModel';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { Plus, Edit, Trash2, Anchor, Users, Ruler } from 'lucide-react';
import type { Boat } from '../../core/domain/types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MoneyInput } from '../components/MoneyInput';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-6">{isNew ? 'Adicionar Nova Lancha' : 'Editar Lancha'}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="boat-name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Lancha</label>
            <input id="boat-name" type="text" placeholder="Ex: Focker 300" value={boat.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full p-3 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="boat-capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacidade (pessoas)</label>
              <input id="boat-capacity" type="number" placeholder="Capacidade" value={boat.capacity} onChange={(e) => onUpdate('capacity', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label htmlFor="boat-size" className="block text-sm font-medium text-gray-700 mb-1">Tamanho (pés)</label>
              <input id="boat-size" type="number" placeholder="Tamanho" value={boat.size} onChange={(e) => onUpdate('size', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <MoneyInput id="boat-price-hour" label="Preço por Hora (Venda)" value={boat.pricePerHour || 0} onChange={(val) => onUpdate('pricePerHour', val)} />
            <MoneyInput id="boat-cost-hour" label="Custo por Hora (Operacional)" value={boat.costPerHour || 0} onChange={(val) => onUpdate('costPerHour', val)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput id="boat-price-half-hour" label="Preço 30min (Venda)" value={boat.pricePerHalfHour || 0} onChange={(val) => onUpdate('pricePerHalfHour', val)} />
            <MoneyInput id="boat-cost-half-hour" label="Custo 30min (Operacional)" value={boat.costPerHalfHour || 0} onChange={(val) => onUpdate('costPerHalfHour', val)} />
          </div>
          <div className="border-t pt-4">
            <label htmlFor="boat-org-time" className="block text-sm font-medium text-gray-700 mb-1">Tempo de Organização (minutos)</label>
            <input id="boat-org-time" type="number" placeholder="Ex: 30" value={boat.organizationTimeMinutes} onChange={(e) => onUpdate('organizationTimeMinutes', parseInt(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
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
  const isAuthorized = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const handleSave = async () => {
    const result = await vm.handleSave();
    if (result && !result.success) {
      showToast(result.error || 'Erro ao salvar lancha.');
    } else {
      showToast('Lancha salva com sucesso!');
    }
  };

  const confirmDelete = async () => {
    const result = await vm.confirmDelete();
    if (result && !result.success) {
      showToast(result.error || 'Erro ao excluir lancha.');
    } else {
      showToast('Lancha excluída com sucesso!');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurar Lanchas</h1>
        {isAuthorized && (
          <button onClick={vm.openNewBoatModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">
            <Plus size={20} className="mr-2" />
            Adicionar Lancha
          </button>
        )}
      </div>

      {vm.isLoading ? (
        <p>Carregando lanchas...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {vm.boats.map((boat) => (
              <li key={boat.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <Anchor size={24} className="text-gray-500 mr-4" />
                  <div>
                    <p className="font-bold text-lg">{boat.name}</p>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Users size={16} className="mr-2" />
                      <span>{boat.capacity} passageiros</span>
                      <Ruler size={16} className="mx-2" />
                      <span>{boat.size} pés</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrencyBRL(boat.pricePerHour || 0)}/h • {formatCurrencyBRL(boat.pricePerHalfHour || 0)}/30min
                    </div>
                    {boat.organizationTimeMinutes > 0 && (
                      <div className="text-xs text-blue-500 font-medium mt-1">
                        Organização: {boat.organizationTimeMinutes} min
                      </div>
                    )}
                  </div>
                </div>
                {isAuthorized && (
                  <div className="flex space-x-2 self-end md:self-auto">
                    <button onClick={() => vm.openEditBoatModal(boat)} className="p-2 text-gray-600 hover:text-blue-600">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => vm.handleDelete(boat.id)} className="p-2 text-gray-600 hover:text-red-600">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </li>
            ))}
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
      <ConfirmationModal
        isOpen={vm.isConfirmModalOpen}
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir esta embarcação? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={vm.closeConfirmDeleteModal}
      />
    </div>
  );
};
