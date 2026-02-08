import React, { useState } from 'react';
import { useTourTypesViewModel } from '../../viewmodels/useTourTypesViewModel';
import { useToastContext } from '../contexts/ToastContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { TourType } from '../../core/domain/types';
import { ConfirmationModal } from '../components/ConfirmationModal';

const TourTypeModal: React.FC<{
  isOpen: boolean;
  tourType: Partial<TourType> | null;
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}> = ({ isOpen, tourType, onSave, onClose }) => {
  const [name, setName] = useState(tourType?.name || '');
  const [color, setColor] = useState(tourType?.color || '#3b82f6');

  React.useEffect(() => {
    if (tourType) {
      setName(tourType.name || '');
      setColor(tourType.color || '#3b82f6');
    }
  }, [tourType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">{tourType?.id ? 'Editar Tipo de Passeio' : 'Adicionar Novo Tipo'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tipo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Aniversário"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 p-1 border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-grow p-3 border rounded-lg uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button
            onClick={() => onSave(name, color)}
            disabled={!name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export const TourTypesScreen: React.FC = () => {
  const vm = useTourTypesViewModel();
  const { showToast } = useToastContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTourType, setEditingTourType] = useState<Partial<TourType> | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tourTypeToDelete, setTourTypeToDelete] = useState<string | null>(null);

  const handleOpenNewModal = () => {
    setEditingTourType({ name: '', color: '#3b82f6' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tourType: TourType) => {
    setEditingTourType(tourType);
    setIsModalOpen(true);
  };

  const handleSave = async (name: string, color: string) => {
    if (editingTourType?.id) {
      await vm.updateTourType({ ...editingTourType, name, color } as TourType);
      showToast('Tipo de passeio atualizado!');
    } else {
      await vm.addTourType(name, color);
      showToast('Tipo de passeio adicionado!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setTourTypeToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tourTypeToDelete) {
      await vm.deleteTourType(tourTypeToDelete);
      showToast('Tipo de passeio excluído!');
      setIsConfirmModalOpen(false);
      setTourTypeToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tipos de Passeio</h1>
        <button onClick={handleOpenNewModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">
          <Plus size={20} className="mr-2" />
          Adicionar Tipo
        </button>
      </div>

      {vm.isLoading ? (
        <p>Carregando tipos...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {vm.tourTypes.map((type) => (
              <li key={type.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-10 rounded-full mr-4 shadow-sm"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <div>
                    <p className="font-bold text-lg">{type.name}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{type.color}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleOpenEditModal(type)} className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDelete(type.id)} className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
            {vm.tourTypes.length === 0 && (
              <li className="p-8 text-center text-gray-500">Nenhum tipo de passeio cadastrado.</li>
            )}
          </ul>
        </div>
      )}

      <TourTypeModal
        isOpen={isModalOpen}
        tourType={editingTourType}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Exclusão"
        message="Deseja arquivar este tipo de passeio? Ele não poderá mais ser selecionado para novos passeios."
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
