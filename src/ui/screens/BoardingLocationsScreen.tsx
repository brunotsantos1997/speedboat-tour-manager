// src/ui/screens/BoardingLocationsScreen.tsx
import React, { useState } from 'react';
import { useBoardingLocationsViewModel } from '../../viewmodels/useBoardingLocationsViewModel';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import type { BoardingLocation } from '../../core/domain/types';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const BoardingLocationsScreen: React.FC = () => {
  const { locations, isLoading, addLocation, updateLocation, deleteLocation, isConfirmModalOpen, confirmDelete, closeConfirmDeleteModal } = useBoardingLocationsViewModel();
  const { currentUser } = useAuth();
  const { showToast } = useToastContext();
  const isAuthorized = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<BoardingLocation> | null>(null);

  const openModal = (location: Partial<BoardingLocation> | null = null) => {
    setCurrentLocation(location);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLocation(null);
  };

  const handleSave = async (locationData: Omit<BoardingLocation, 'id'>) => {
    let result;
    if (currentLocation && 'id' in currentLocation) {
      result = await updateLocation({ ...locationData, id: currentLocation.id as string });
    } else {
      result = await addLocation(locationData);
    }

    if (result && !result.success) {
      showToast(result.error || 'Erro ao salvar local.');
    } else {
      showToast('Local salvo com sucesso!');
      closeModal();
    }
  };

  const handleConfirmDelete = async () => {
    const result = await confirmDelete();
    if (result && !result.success) {
      showToast(result.error || 'Erro ao excluir local.');
    } else {
      showToast('Local excluído com sucesso!');
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Locais de Embarque</h1>
          <p className="text-gray-500">Onde seus clientes iniciam o passeio</p>
        </div>
        {isAuthorized && (
          <button onClick={() => openModal()} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
            Adicionar Local
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 hidden md:table-header-group">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Local</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mapa</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {locations.map((location) => (
              <tr key={location.id} className="flex flex-col md:table-row hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 md:whitespace-nowrap text-lg md:text-sm font-bold md:font-medium text-gray-900">{location.name}</td>
                <td className="px-6 py-2 md:py-4 md:whitespace-nowrap text-sm">
                  {location.mapLink ? (
                    <a href={location.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-1 rounded-full text-xs">
                        Ver no Google Maps
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Sem link</span>
                  )}
                </td>
                {isAuthorized && (
                  <td className="px-6 py-4 md:whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                        <button onClick={() => openModal(location)} className="flex-1 md:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-bold text-xs md:text-sm">Editar</button>
                        <button onClick={() => deleteLocation(location.id)} className="flex-1 md:flex-none border border-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-bold text-xs md:text-sm">Excluir</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <LocationModal
          location={currentLocation}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir este local de embarque? Esta ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDeleteModal}
      />
    </div>
  );
};

// Modal Component
const LocationModal: React.FC<{
  location: Partial<BoardingLocation> | null;
  onClose: () => void;
  onSave: (locationData: Omit<BoardingLocation, 'id'>) => void;
}> = ({ location, onClose, onSave }) => {
  const [name, setName] = useState(location?.name || '');
  const [mapLink, setMapLink] = useState(location?.mapLink || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, mapLink });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md">
        <h2 className="text-2xl font-black mb-6 text-gray-900 border-b pb-4">{location ? 'Editar' : 'Adicionar'} Local</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-widest" htmlFor="name">Nome do Local</label>
            <input
              id="name"
              type="text"
              value={name}
              placeholder="Ex: Marina da Glória"
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-widest" htmlFor="mapLink">Link do Google Maps (Opcional)</label>
            <input
              id="mapLink"
              type="url"
              value={mapLink}
              placeholder="https://goo.gl/maps/..."
              onChange={(e) => setMapLink(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Salvar Local</button>
          </div>
        </form>
      </div>
    </div>
  );
};
