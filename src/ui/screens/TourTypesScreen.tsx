import React, { useState } from 'react';
import { useTourTypesViewModel } from '../../viewmodels/useTourTypesViewModel';
import { useToastContext } from '../contexts/ToastContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { TourType } from '../../core/domain/types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Tutorial } from '../components/Tutorial';
import { tourTypesSteps } from '../tutorials/tourTypesSteps';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md">
        <h2 className="text-2xl font-black mb-6 text-gray-900 border-b pb-4">{tourType?.id ? 'Editar Tipo' : 'Novo Tipo'}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-widest">Nome do Tipo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="Ex: Aniversário, Passeio Familiar"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-widest">Cor de Identificação</label>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-14 h-14 p-1 border border-gray-300 rounded-xl cursor-pointer bg-white"
                />
              </div>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-grow p-3 border border-gray-300 rounded-xl uppercase focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-10">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
          <button
            onClick={() => onSave(name, color)}
            disabled={!name}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Salvar Tipo
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Tutorial tourId="tour-types" steps={tourTypesSteps} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Tipos de Passeio</h1>
          <p className="text-gray-500">Categorize e identifique seus eventos pela cor</p>
        </div>
        <button onClick={handleOpenNewModal} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95" data-tour="btn-add-tour-type">
          <Plus size={20} className="mr-2" />
          Adicionar Tipo
        </button>
      </div>

      {vm.isLoading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-tour="tour-types-list">
          <ul className="divide-y divide-gray-100">
            {vm.tourTypes.length > 0 ? vm.tourTypes.map((type) => (
              <li key={type.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center">
                  <div
                    className="w-3 h-12 rounded-full mr-5 shadow-sm border border-black border-opacity-5"
                    style={{ backgroundColor: type.color }}
                    data-tour="tour-type-color"
                  ></div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg leading-tight">{type.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 uppercase tracking-widest">{type.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEditModal(type)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDelete(type.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            )) : (
                <li className="p-12 text-center text-gray-500 font-medium">Nenhum tipo de passeio cadastrado.</li>
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
