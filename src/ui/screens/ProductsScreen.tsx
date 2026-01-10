// src/ui/screens/ProductsScreen.tsx
import React from 'react';
import { useProductsViewModel } from '../../viewmodels/useProductsViewModel';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import type { Product } from '../../core/domain/types';
import IconPicker from '../components/IconPicker';
import type { IconKey } from '../components/IconPicker';

// --- Components ---

const ProductModal: React.FC<{
  isOpen: boolean;
  product: Partial<Product> | null;
  onSave: () => void;
  onClose: () => void;
  onUpdate: (field: keyof Product, value: any) => void;
}> = ({ isOpen, product, onSave, onClose, onUpdate }) => {
  if (!isOpen || !product) return null;

  const isNew = !product.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-6">{isNew ? 'Adicionar Novo Produto' : 'Editar Produto'}</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Nome do Produto" value={product.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full p-3 border rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Preço" value={product.price} onChange={(e) => onUpdate('price', parseFloat(e.target.value) || 0)} className="w-full p-3 border rounded-lg" />
            <select value={product.pricingType} onChange={(e) => onUpdate('pricingType', e.target.value)} className="w-full p-3 border rounded-lg bg-white">
              <option value="FIXED">Preço Fixo</option>
              <option value="PER_PERSON">Por Pessoa</option>
            </select>
          </div>
          <IconPicker
            selectedIcon={product.iconKey as IconKey}
            onSelectIcon={(iconKey) => onUpdate('iconKey', iconKey)}
          />
          <div className="flex items-center">
            <input type="checkbox" id="isDefaultCourtesy" checked={product.isDefaultCourtesy} onChange={(e) => onUpdate('isDefaultCourtesy', e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2" />
            <label htmlFor="isDefaultCourtesy">Marcar como cortesia por padrão?</label>
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

export const ProductsScreen: React.FC = () => {
  const vm = useProductsViewModel();

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurar Produtos</h1>
        <button onClick={vm.openNewProductModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">
          <Plus size={20} className="mr-2" />
          Adicionar Produto
        </button>
      </div>

      {vm.isLoading ? (
        <p>Carregando produtos...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {vm.products.map((product) => (
              <li key={product.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <Package size={24} className="text-gray-500 mr-4" />
                  <div>
                    <p className="font-bold text-lg">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      R$ {product.price.toFixed(2)} {product.pricingType === 'PER_PERSON' && '/ pessoa'}
                    </p>
                    {product.isDefaultCourtesy && (
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Cortesia Padrão</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 self-end md:self-auto">
                  <button onClick={() => vm.openEditProductModal(product)} className="p-2 text-gray-600 hover:text-blue-600">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => vm.handleDelete(product.id)} className="p-2 text-gray-600 hover:text-red-600">
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProductModal
        isOpen={vm.isModalOpen}
        product={vm.editingProduct}
        onSave={vm.handleSave}
        onClose={vm.closeModal}
        onUpdate={vm.updateEditingProduct}
      />
    </div>
  );
};
