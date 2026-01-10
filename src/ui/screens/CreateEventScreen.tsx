// src/ui/screens/CreateEventScreen.tsx
import React from 'react';
import { Anchor, Utensils, Beer, User, Circle, HelpCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useCreateEventViewModel } from '../../viewmodels/useCreateEventViewModel';
import type { Combo } from '../../core/domain/types';

// Icon map for robust dynamic rendering
const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Anchor,
  Utensils,
  Beer,
  User,
  Circle,
};

// Helper to render icons dynamically
const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

// Main Screen Component
export const CreateEventScreen: React.FC = () => {
  const {
    availableCombos,
    selectedCombos,
    discount,
    clientPhone,
    loyaltySuggestion,
    subtotal,
    totalDiscount,
    total,
    toggleCombo,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updateClientPhone,
  } = useCreateEventViewModel();

  const isComboSelected = (combo: Combo) => selectedCombos.some(c => c.id === combo.id);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Criar Novo Passeio</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-48"> {/* Padding bottom to clear footer */}
        {/* Client & Loyalty Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Cliente</h2>
          <input
            type="tel"
            placeholder="Telefone (WhatsApp) do Cliente"
            value={clientPhone}
            onChange={(e) => updateClientPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {loyaltySuggestion && (
            <div className="mt-3 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-lg">
              <p className="font-bold">Sugestão!</p>
              <p>{loyaltySuggestion}</p>
            </div>
          )}
        </section>

        {/* Available Combos */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Combos Disponíveis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableCombos.map((combo) => (
              <label
                key={combo.id}
                htmlFor={`combo-${combo.id}`}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  isComboSelected(combo)
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
              >
                <DynamicIcon name={combo.iconKey} className="w-6 h-6 mr-4 text-gray-600" />
                <div className="flex-grow">
                  <p className="font-semibold">{combo.name}</p>
                  <p className="text-sm text-gray-500">R$ {combo.price.toFixed(2)}</p>
                </div>
                <input
                  id={`combo-${combo.id}`}
                  type="checkbox"
                  checked={isComboSelected(combo)}
                  onChange={() => toggleCombo(combo)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Selected Items & Discount */}
        {selectedCombos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Itens Selecionados</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm divide-y divide-gray-200">
              {selectedCombos.map((combo) => (
                <div key={combo.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{combo.name}</p>
                    <p className={`text-sm ${combo.isCourtesy ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      R$ {combo.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">{combo.isCourtesy ? 'Cortesia' : 'Marcar Cortesia'}</span>
                    <label htmlFor={`courtesy-${combo.id}`} className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id={`courtesy-${combo.id}`} className="sr-only peer" checked={combo.isCourtesy} onChange={() => toggleCourtesy(combo.id)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="mt-6">
               <h3 className="text-md font-semibold mb-2">Desconto</h3>
               <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                 <div className="flex">
                    <button onClick={() => updateDiscountType('FIXED')} className={`px-4 py-2 text-sm rounded-l-md ${discount.type === 'FIXED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>R$</button>
                    <button onClick={() => updateDiscountType('PERCENTAGE')} className={`px-4 py-2 text-sm rounded-r-md ${discount.type === 'PERCENTAGE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>%</button>
                 </div>
                 <input type="number" value={discount.value} onChange={(e) => updateDiscountValue(parseFloat(e.target.value))} className="w-full p-2 border-l border-gray-300 focus:ring-0 focus:border-gray-400 text-right" placeholder="0.00"/>
               </div>
            </div>

          </section>
        )}
      </main>

      {/* Sticky Footer Summary */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2 text-red-600">
            <span >Desconto</span>
            <span className="font-medium">- R$ {totalDiscount.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
