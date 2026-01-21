// src/ui/screens/BoatsScreen.tsx
import React from 'react';
import { useBoatsViewModel } from '../../viewmodels/useBoatsViewModel';
import { Plus, Edit, Trash2, Anchor, Users, Ruler } from 'lucide-react';
import type { Boat } from '../../core/domain/types';

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
        <h2 className="text-xl font-bold mb-6">{isNew ? 'Adicionar Nova Embarcação' : 'Editar Embarcação'}</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Nome da Embarcação (ex: Focker 300)" value={boat.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full p-3 border rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Passageiros</label>
              <input type="number" placeholder="Capacidade" value={boat.capacity} onChange={(e) => onUpdate('capacity', parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (pés)</label>
              <input type="number" placeholder="Tamanho (pés)" value={boat.size} onChange={(e) => onUpdate('size', parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço por Hora (R$)</label>
              <input type="number" placeholder="Preço por Hora (R$)" value={boat.pricePerHour} onChange={(e) => onUpdate('pricePerHour', parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço por Meia Hora (R$)</label>
              <input type="number" placeholder="Preço por Meia Hora (R$)" value={boat.pricePerHalfHour} onChange={(e) => onUpdate('pricePerHalfHour', parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-lg" />
            </div>
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

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurar Embarcações</h1>
        <button onClick={vm.openNewBoatModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">
          <Plus size={20} className="mr-2" />
          Adicionar Embarcação
        </button>
      </div>

      {vm.isLoading ? (
        <p>Carregando embarcações...</p>
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
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>Preço por Hora: R$ {boat.pricePerHour}</span>
                      <span className="mx-2">|</span>
                      <span>Preço por Meia Hora: R$ {boat.pricePerHalfHour}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 self-end md:self-auto">
                  <button onClick={() => vm.openEditBoatModal(boat)} className="p-2 text-gray-600 hover:text-blue-600">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => vm.handleDelete(boat.id)} className="p-2 text-gray-600 hover:text-red-600">
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BoatModal
        isOpen={vm.isModalOpen}
        boat={vm.editingBoat}
        onSave={vm.handleSave}
        onClose={vm.closeModal}
        onUpdate={vm.updateEditingBoat}
      />
    </div>
  );
};
