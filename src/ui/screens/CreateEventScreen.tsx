// src/ui/screens/CreateEventScreen.tsx
import React from 'react';
import { Anchor, Utensils, Beer, User, Circle, HelpCircle, Users, Search, X, Package, Pencil, Trash2, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useCreateEventViewModel } from '../../viewmodels/useCreateEventViewModel';
import type { Product, ClientProfile } from '../../core/domain/types';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Components ---

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const iconMap: { [key: string]: React.FC<LucideProps> } = { Anchor, Utensils, Beer, User, Circle, Package };
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

const NewClientModal: React.FC<{
  isOpen: boolean;
  editingClient: ClientProfile | null;
  name: string;
  phone: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ isOpen, editingClient, name, phone, setName, setPhone, onSave, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">
          {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nome do Cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder="Telefone (WhatsApp)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editingClient ? 'Atualizar' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---

export const CreateEventScreen: React.FC = () => {
  const vm = useCreateEventViewModel();
  const isProductSelected = (product: Product) => vm.selectedProducts.some(p => p.id === product.id);

  const bookedDays = vm.scheduledEvents.map(event => new Date(event.date));

  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      <main className="max-w-7xl mx-auto p-4 pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Event Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section: Client and Passengers */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Search */}
              <div className="relative">
                <h2 className="text-lg font-semibold mb-2">Cliente</h2>
                {vm.selectedClient ? (
                  <div className="flex items-center justify-between bg-white p-3 border border-gray-300 rounded-lg">
                    <div>
                      <p className="font-bold">{vm.selectedClient.name}</p>
                      <p className="text-sm text-gray-500">{vm.selectedClient.phone}</p>
                    </div>
                    <button onClick={vm.clearClientSelection} className="p-1 text-gray-500 hover:text-red-600">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou telefone"
                        value={vm.clientSearchTerm}
                        onChange={(e) => vm.handleClientSearch(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {vm.clientSearchResults.length > 0 && (
                      <ul className="absolute w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                        {vm.clientSearchResults.map((client) => (
                          <li key={client.id} className="flex items-center justify-between p-3 hover:bg-gray-100 group">
                            <div onClick={() => vm.selectClient(client)} className="flex-grow cursor-pointer">
                              <p className="font-semibold">{client.name}</p>
                              <p className="text-sm text-gray-500">{client.phone}</p>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => vm.handleOpenModal(client)} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={18} /></button>
                              <button onClick={() => vm.handleDeleteClient(client.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {vm.clientSearchTerm.length > 2 && !vm.isSearching && vm.clientSearchResults.length === 0 && (
                      <div className="bg-white border border-gray-300 rounded-lg mt-1 p-4 text-center">
                        <p className="text-gray-600 mb-3">Nenhum cliente encontrado.</p>
                        <button onClick={() => vm.handleOpenModal(null)} className="text-blue-600 font-semibold hover:underline">+ Cadastrar Novo Cliente</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Passenger Count */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Nº de Passageiros</h2>
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="number" min="1" value={vm.passengerCount} onChange={(e) => vm.updatePassengerCount(parseInt(e.target.value, 10))} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                {vm.isCapacityExceeded && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertTriangle size={16} className="mr-1"/>
                    Atenção: Capacidade da lancha excedida!
                  </div>
                )}
              </div>
            </section>

            {/* Section: Available Products */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Produtos Disponíveis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vm.availableProducts.map((product) => (
                  <label key={product.id} htmlFor={`product-${product.id}`} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${isProductSelected(product) ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}>
                    <DynamicIcon name={product.iconKey} className="w-6 h-6 mr-4 text-gray-600" />
                    <div className="flex-grow">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        R$ {product.price.toFixed(2)}
                        {product.pricingType === 'PER_PERSON' && ' / pessoa'}
                      </p>
                    </div>
                    <input id={`product-${product.id}`} type="checkbox" checked={isProductSelected(product)} onChange={() => vm.toggleProduct(product)} className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  </label>
                ))}
              </div>
            </section>

            {/* Selected Items & Discount */}
            {vm.selectedProducts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Itens Selecionados</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm divide-y divide-gray-200">
                  {vm.selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className={`text-sm ${product.isCourtesy ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                          R$ {product.price.toFixed(2)}
                          {product.pricingType === 'PER_PERSON' && ` x ${vm.passengerCount} passageiros`}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{product.isCourtesy ? 'Cortesia' : 'Marcar Cortesia'}</span>
                        <label htmlFor={`courtesy-${product.id}`} className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" id={`courtesy-${product.id}`} className="sr-only peer" checked={product.isCourtesy} onChange={() => vm.toggleCourtesy(product.id)} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h3 className="text-md font-semibold mb-2">Desconto</h3>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                    <div className="flex">
                      <button onClick={() => vm.updateDiscountType('FIXED')} className={`px-4 py-2 text-sm rounded-l-md ${vm.discount.type === 'FIXED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>R$</button>
                      <button onClick={() => vm.updateDiscountType('PERCENTAGE')} className={`px-4 py-2 text-sm rounded-r-md ${vm.discount.type === 'PERCENTAGE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>%</button>
                    </div>
                    <input type="number" value={vm.discount.value} onChange={(e) => vm.updateDiscountValue(parseFloat(e.target.value))} className="w-full p-2 border-l border-gray-300 focus:ring-0 focus:border-gray-400 text-right" placeholder="0.00"/>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Scheduling */}
          <aside className="lg:col-span-1 space-y-6">
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Agendamento</h2>
              {/* Boat Selection */}
              <div className="mb-4">
                  <label htmlFor="boat-select" className="block text-sm font-medium text-gray-700 mb-1">Lancha</label>
                  <select id="boat-select" value={vm.selectedBoat?.id || ''} onChange={(e) => vm.handleBoatSelection(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                      {vm.availableBoats.map(boat => (
                          <option key={boat.id} value={boat.id}>{boat.name} (Cap: {boat.capacity})</option>
                      ))}
                  </select>
              </div>

              {/* Calendar */}
              <DayPicker
                mode="single"
                selected={vm.selectedDate}
                onSelect={vm.setSelectedDate}
                locale={ptBR}
                modifiers={{ booked: bookedDays }}
                modifiersStyles={{ booked: { color: 'red', fontWeight: 'bold' } }}
                className="rounded-md"
              />

              {/* Time Input */}
              <div className="mt-4">
                <label htmlFor="time-input" className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  <input id="time-input" type="time" value={vm.selectedTime} onChange={e => vm.setSelectedTime(e.target.value)} className="w-full p-2 pl-10 border border-gray-300 rounded-lg"/>
                </div>
              </div>

              {/* Scheduled Events for the day */}
              {vm.scheduledEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-md font-semibold text-gray-800">Passeios Agendados ({format(vm.selectedDate || new Date(), 'dd/MM')})</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {vm.scheduledEvents.map(event => (
                      <li key={event.id} className="p-2 bg-gray-100 rounded-md">
                        <p className="font-bold">{event.client.name}</p>
                        <p>Horário: {event.time} - Lancha: {event.boat.name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          {/* Pricing Summary */}
          <div className="flex-grow pr-4">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R$ {vm.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2 text-red-600">
              <span>Desconto</span>
              <span className="font-medium">- R$ {vm.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span>R$ {vm.total.toFixed(2)}</span>
            </div>
          </div>
          {/* Action Button */}
          <button className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-bold shadow-lg">
            Agendar Passeio
          </button>
        </div>
      </footer>

      <NewClientModal
        isOpen={vm.isModalOpen}
        editingClient={vm.editingClient}
        name={vm.newClientName}
        phone={vm.newClientPhone}
        setName={vm.setNewClientName}
        setPhone={vm.setNewClientPhone}
        onSave={vm.handleSaveClient}
        onClose={vm.handleCloseModal}
      />
    </div>
  );
};
