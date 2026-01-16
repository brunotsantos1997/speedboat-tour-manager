// src/ui/screens/BoardingLocationsScreen.tsx
import React, { useState } from 'react';
import { useBoardingLocationsViewModel } from '../../viewmodels/useBoardingLocationsViewModel';
import type { BoardingLocation } from '../../core/domain/types';

export const BoardingLocationsScreen: React.FC = () => {
  const { locations, isLoading, addLocation, updateLocation, deleteLocation } = useBoardingLocationsViewModel();
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

  const handleSave = (locationData: Omit<BoardingLocation, 'id'>) => {
    if (currentLocation && 'id' in currentLocation) {
      updateLocation({ ...locationData, id: currentLocation.id as string });
    } else {
      addLocation(locationData);
    }
    closeModal();
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Locais de Embarque</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          Adicionar Local
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link do Mapa</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={location.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a href={location.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver no mapa
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(location)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                  <button onClick={() => deleteLocation(location.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                </td>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{location ? 'Editar' : 'Adicionar'} Local de Embarque</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mapLink">Link do Mapa (Opcional)</label>
            <input
              id="mapLink"
              type="text"
              value={mapLink}
              onChange={(e) => setMapLink(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-end">
            <button type="button" onClick={onClose} className="mr-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
