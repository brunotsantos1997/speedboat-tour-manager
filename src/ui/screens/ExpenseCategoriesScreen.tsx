// src/ui/screens/ExpenseCategoriesScreen.tsx
import React, { useState } from 'react';
import { useExpenseViewModel } from '../../viewmodels/useExpenseViewModel';
import { Plus, Trash2, Pencil, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExpenseCategoriesScreen: React.FC = () => {
  const { categories, addCategory, updateCategory, removeCategory, loading } = useExpenseViewModel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleOpenModal = (cat?: any) => {
    if (cat) {
      setEditingCatId(cat.id);
      setName(cat.name);
    } else {
      setEditingCatId(null);
      setName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name) return;
    if (editingCatId) {
      await updateCategory({ id: editingCatId, name });
    } else {
      await addCategory(name);
    }
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard/finance" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorias de Despesa</h1>
            <p className="text-gray-500">Personalize como você organiza seus gastos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Nome da Categoria</span>
            <button
                onClick={() => handleOpenModal()}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
            >
                <Plus size={16} />
                Adicionar
            </button>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.length > 0 ? categories.map(cat => (
            <div key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">{cat.name}</span>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(cat)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <Pencil size={18} />
                </button>
                <button onClick={() => removeCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 italic">Nenhuma categoria cadastrada.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">{editingCatId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6"
              placeholder="Ex: Manutenção, Combustível..."
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
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
