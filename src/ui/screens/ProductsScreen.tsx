// src/ui/screens/ProductsScreen.tsx
import React from 'react';
import { useProductsViewModel } from '../../viewmodels/useProductsViewModel';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import type { Product } from '../../core/domain/types';
import IconPicker from '../components/IconPicker';
import type { IconKey } from '../components/IconPicker';
import { MoneyInput } from '../components/MoneyInput';
import { useModalContext } from '../contexts/ModalContext';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { Tutorial } from '../components/Tutorial';
import { productsSteps } from '../tutorials/productsSteps';

// --- Components ---

const ProductModal: React.FC<{
  isOpen: boolean;
  product: Partial<Product> | null;
  onSave: () => void;
  onClose: () => void;
  onUpdate: (field: keyof Product, value: string | number | boolean) => void;
}> = ({ isOpen, product, onSave, onClose, onUpdate }) => {
  if (!isOpen || !product) return null;

  const isNew = !product.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-black mb-6 text-gray-900 border-b pb-4">{isNew ? 'Adicionar Novo Produto' : 'Editar Produto'}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Nome do Produto</label>
            <input type="text" placeholder="Ex: Cerveja, Almoço..." value={product.name} onChange={(e) => onUpdate('name', e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.pricingType === 'HOURLY' ? (
              <>
                <MoneyInput label="Preço/Hora (Venda)" value={product.hourlyPrice || 0} onChange={(val) => onUpdate('hourlyPrice', val)} />
                <MoneyInput label="Custo/Hora (Operac.)" value={product.hourlyCost || 0} onChange={(val) => onUpdate('hourlyCost', val)} />
              </>
            ) : (
              <>
                <MoneyInput label={product.pricingType === 'PER_PERSON' ? 'Preço/Pessoa (Venda)' : 'Preço Fixo (Venda)'} value={product.price || 0} onChange={(val) => onUpdate('price', val)} />
                <MoneyInput label={product.pricingType === 'PER_PERSON' ? 'Custo/Pessoa (Operac.)' : 'Custo Fixo (Operac.)'} value={product.cost || 0} onChange={(val) => onUpdate('cost', val)} />
              </>
            )}
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Tipo de Cobrança</label>
              <select value={product.pricingType} onChange={(e) => onUpdate('pricingType', e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                <option value="FIXED">Preço Fixo</option>
                <option value="PER_PERSON">Por Pessoa</option>
                <option value="HOURLY">Por Hora</option>
              </select>
            </div>
          </div>

          <IconPicker
            selectedIcon={product.iconKey as IconKey}
            onSelectIcon={(iconKey) => onUpdate('iconKey', iconKey)}
          />

          <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
            <input type="checkbox" id="isDefaultCourtesy" checked={product.isDefaultCourtesy} onChange={(e) => onUpdate('isDefaultCourtesy', e.target.checked)} className="h-5 w-5 text-blue-600 border-gray-300 rounded-lg mr-3 focus:ring-blue-500" />
            <label htmlFor="isDefaultCourtesy" className="font-bold text-blue-800 text-sm">Marcar como cortesia por padrão?</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-10">
          <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={onSave} className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">Salvar Produto</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---

export const ProductsScreen: React.FC = () => {
  const vm = useProductsViewModel();
  const { currentUser } = useAuth();
  const { showToast } = useToastContext();
  const { confirm } = useModalContext();
  const isAuthorized = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const handleSave = async () => {
    const result = await vm.handleSave();
    if (result && !result.success) {
      showToast(result.error || 'Erro ao salvar produto.');
    } else {
      showToast('Produto salvo com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Confirmar Exclusão', 'Tem certeza de que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        const result = await vm.confirmDeleteExternal(id);
        if (result && !result.success) {
            showToast(result.error || 'Erro ao excluir produto.');
        } else {
            showToast('Produto excluído com sucesso!');
        }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Tutorial tourId="products" steps={productsSteps} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Produtos e Serviços</h1>
          <p className="text-gray-500">Gerencie itens adicionais para os passeios</p>
        </div>
        {isAuthorized && (
          <button onClick={vm.openNewProductModal} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95" data-tour="btn-add-product">
            <Plus size={20} className="mr-2" />
            Adicionar Produto
          </button>
        )}
      </div>

      {vm.isLoading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-tour="products-list">
          <ul className="divide-y divide-gray-100">
            {vm.products.length > 0 ? vm.products.map((product) => (
              <li key={product.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Package size={24} />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-medium text-gray-500">
                        {product.pricingType === 'HOURLY'
                            ? `${formatCurrencyBRL(product.hourlyPrice || 0)} / hora`
                            : `${formatCurrencyBRL(product.price || 0)}`
                        }
                        {product.pricingType === 'PER_PERSON' && ' / pessoa'}
                        </p>
                        {product.isDefaultCourtesy && (
                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Cortesia Padrão</span>
                        )}
                    </div>
                  </div>
                </div>
                {isAuthorized && (
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button onClick={() => vm.openEditProductModal(product)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar" data-tour="btn-edit-product">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </li>
            )) : (
                <li className="p-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto text-gray-200 mb-3" />
                    <p>Nenhum produto cadastrado.</p>
                </li>
            )}
          </ul>
        </div>
      )}

      <ProductModal
        isOpen={vm.isModalOpen}
        product={vm.editingProduct}
        onSave={handleSave}
        onClose={vm.closeModal}
        onUpdate={vm.updateEditingProduct}
      />
    </div>
  );
};
