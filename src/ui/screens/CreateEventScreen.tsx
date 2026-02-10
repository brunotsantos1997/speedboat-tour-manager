// src/ui/screens/CreateEventScreen.tsx
import React, { useState } from 'react';
import { Anchor, Utensils, Beer, User, Circle, HelpCircle, Users, Search, X, Package, Pencil, Trash2, AlertTriangle, Minus, Plus, Tag } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useCreateEventViewModel } from '../../viewmodels/useCreateEventViewModel';
import { useToastContext } from '../../ui/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import type { Product, ClientProfile } from '../../core/domain/types';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { MoneyInput } from '../components/MoneyInput';
import { CustomTimePicker } from '../components/CustomTimePicker';
import { EndTimePicker } from '../components/EndTimePicker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';

// --- Components ---



const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const iconMap: { [key: string]: React.FC<LucideProps> } = { Anchor, Utensils, Beer, User, Circle, Package };
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

const NumericInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, min = 0, max, step = 1 }) => {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      onChange(num);
    } else if (e.target.value === '') {
      onChange(0);
    }
  };

  return (
    <div className="flex items-center">
      <button onClick={handleDecrement} className="p-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50" disabled={min !== undefined && value <= min}>
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        min={min}
        max={max}
        step={step}
        className="w-full p-2 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ MozAppearance: 'textfield' }}
      />
      <button onClick={handleIncrement} className="p-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50" disabled={max !== undefined && value >= max}>
        <Plus size={16} />
      </button>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};


const QuickTourTypeModal: React.FC<{
  isOpen: boolean;
  onSave: (name: string, color: string) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Novo Tipo de Passeio</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nome do Tipo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
             <input
               type="color"
               value={color}
               onChange={(e) => setColor(e.target.value)}
               className="w-full h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
             />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (name) {
                await onSave(name, color);
                setName('');
                setColor('#3b82f6');
                onClose();
              }
            }}
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


const NewClientModal: React.FC<{
  isOpen: boolean;
  editingClient: ClientProfile | null;
  name: string;
  phone: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  onSave: () => Promise<void> | void;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ isOpen, editingClient, name, phone, setName, setPhone, onSave, onClose, showToast }) => {
  if (!isOpen) return null;

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 13 digits (55 + 2 for DDD + 9 for number)
    const limited = digits.slice(0, 13);

    // +55 (99) 99999-9999
    let formatted = '';
    if (limited.length > 0) {
      formatted = '+' + limited.slice(0, 2);
    }
    if (limited.length > 2) {
      formatted += ' (' + limited.slice(2, 4);
    }
    if (limited.length > 4) {
      formatted += ') ' + limited.slice(4, 9);
    }
    if (limited.length > 9) {
      formatted += '-' + limited.slice(9, 13);
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

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
            onChange={handlePhoneChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={async () => {
              try {
                await onSave();
              } catch (error) {
                console.error(error);
                showToast('Erro ao salvar cliente. Verifique os dados e tente novamente.', 'error');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const [isTourTypeModalOpen, setIsTourTypeModalOpen] = useState(false);

  if (vm.isLoading) {
    return <div className="p-6">Carregando dados do passeio...</div>;
  }

  const isProductSelected = (product: Product) => vm.selectedProducts.some(p => p.id === product.id);

  const bookedDays = vm.scheduledEvents.map(event => new Date(event.date));

  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      <main className="max-w-7xl mx-auto p-4 pb-64">
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
                <h2 className="text-lg font-semibold mb-2 flex items-center">
                  <Users className="mr-2 text-gray-500" size={20} />
                  Nº de Passageiros
                </h2>
                <NumericInput
                  value={vm.passengerCount}
                  onChange={vm.updatePassengerCount}
                  min={1}
                  max={vm.selectedBoat?.capacity}
                />
                {vm.isCapacityExceeded && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertTriangle size={16} className="mr-1"/>
                    Atenção: Capacidade da lancha excedida!
                  </div>
                )}
              </div>
            </section>

            {/* Section: Date, Time & Reservation Settings */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Agendamento e Reserva</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="flex justify-center lg:justify-start border rounded-lg p-2 bg-gray-50">
                  <DayPicker
                    mode="single"
                    selected={vm.selectedDate}
                    onSelect={vm.setSelectedDate}
                    locale={ptBR}
                    modifiers={{ booked: bookedDays }}
                    modifiersStyles={{ booked: { color: 'red', fontWeight: 'bold' } }}
                    className="rounded-md m-0"
                  />
                </div>
                <div className="space-y-6">
                  {/* Time Picker */}
                  <div className="grid grid-cols-2 gap-4">
                    {vm.isBusinessClosed ? (
                      <div className="col-span-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-md">
                        <p className="font-bold">Fechado neste dia</p>
                        <p className="text-sm">Por favor, selecione outra data.</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                          <CustomTimePicker
                            value={vm.startTime}
                            onChange={vm.setStartTime}
                            disabled={vm.isBusinessClosed}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                          <EndTimePicker
                            value={vm.endTime}
                            onChange={vm.setEndTime}
                            options={vm.availableEndTimeSlots}
                            disabled={vm.isBusinessClosed}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Boat Selection */}
                  <div>
                      <label htmlFor="boat-select" className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Lancha</label>
                      <select id="boat-select" value={vm.selectedBoat?.id || ''} onChange={(e) => vm.handleBoatSelection(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                          {vm.availableBoats.map(boat => (
                              <option key={boat.id} value={boat.id}>{boat.name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Boarding Location Selection */}
                  <div>
                      <label htmlFor="boarding-location-select" className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Local de Embarque</label>
                      <select id="boarding-location-select" value={vm.selectedBoardingLocation?.id || ''} onChange={(e) => vm.handleBoardingLocationSelection(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                          {vm.availableBoardingLocations.map(location => (
                              <option key={location.id} value={location.id}>{location.name}</option>
                          ))}
                      </select>
                  </div>

                  {/* Tour Type Selection */}
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="tour-type-select" className="block text-sm font-medium text-gray-700 font-semibold flex items-center">
                          <Tag size={16} className="mr-1 text-gray-500" />
                          Tipo de Passeio
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsTourTypeModalOpen(true)}
                          className="text-xs text-blue-600 hover:underline flex items-center"
                        >
                          <Plus size={12} className="mr-0.5" /> Novo Tipo
                        </button>
                      </div>
                      <select
                        id="tour-type-select"
                        value={vm.selectedTourType?.id || ''}
                        onChange={(e) => vm.handleTourTypeSelection(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      >
                          <option value="" disabled>Selecione um tipo...</option>
                          {vm.availableTourTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                      </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Boat Discount (Immediately after settings) */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Desconto no Aluguel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-2">
                <div className="col-span-1 flex">
                  <button onClick={() => vm.updateDiscountType('FIXED', 'rental')} className={`flex-grow px-2 py-2 text-sm rounded-l-md font-bold ${vm.rentalDiscount.type === 'FIXED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>R$</button>
                  <button onClick={() => vm.updateDiscountType('PERCENTAGE', 'rental')} className={`flex-grow px-2 py-2 text-sm rounded-r-md font-bold ${vm.rentalDiscount.type === 'PERCENTAGE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>%</button>
                </div>
                <div className="col-span-2">
                  {vm.rentalDiscount.type === 'PERCENTAGE' ? (
                    <NumericInput
                      value={vm.rentalDiscount.value}
                      onChange={(val) => vm.updateDiscountValue(val, 'rental')}
                      min={0}
                    />
                  ) : (
                    <MoneyInput
                      value={vm.rentalDiscount.value}
                      onChange={(val) => vm.updateDiscountValue(val, 'rental')}
                    />
                  )}
                </div>
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
                        {product.pricingType === 'HOURLY'
                          ? `${formatCurrencyBRL(product.hourlyPrice || 0)} / hora`
                          : `${formatCurrencyBRL(product.price || 0)}`}
                        {product.pricingType === 'PER_PERSON' && ' / pessoa'}
                      </p>
                    </div>
                    <input id={`product-${product.id}`} type="checkbox" checked={isProductSelected(product)} onChange={() => vm.toggleProduct(product)} className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  </label>
                ))}
              </div>
            </section>

            {/* Selected Items */}
            {vm.selectedProducts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Itens Selecionados</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm divide-y divide-gray-200">
                  {vm.selectedProducts.map((product) => {
                    const selectedProd = vm.selectedProducts.find(p => p.id === product.id);
                    const prodDiscount = selectedProd?.discount || { type: 'FIXED', value: 0 };
                    return (
                      <div key={product.id} className="py-4 first:pt-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className={`text-sm ${product.isCourtesy ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                              {product.pricingType === 'HOURLY'
                                ? `${formatCurrencyBRL(product.hourlyPrice || 0)} / hora`
                                : `${formatCurrencyBRL(product.price || 0)}`}
                              {product.pricingType === 'PER_PERSON' && ` x ${vm.passengerCount} pessoas`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2 uppercase font-bold">{product.isCourtesy ? 'Cortesia' : 'Cortesia?'}</span>
                              <label htmlFor={`courtesy-${product.id}`} className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id={`courtesy-${product.id}`} className="sr-only peer" checked={product.isCourtesy} onChange={() => vm.toggleCourtesy(product.id)} />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Per-Product Discount */}
                        {!product.isCourtesy && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Desconto no Produto</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                              <div className="col-span-1 flex">
                                <button onClick={() => vm.updateProductDiscount(product.id, { ...prodDiscount, type: 'FIXED' })} className={`flex-grow px-2 py-1.5 text-xs rounded-l-md font-bold ${prodDiscount.type === 'FIXED' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>R$</button>
                                <button onClick={() => vm.updateProductDiscount(product.id, { ...prodDiscount, type: 'PERCENTAGE' })} className={`flex-grow px-2 py-1.5 text-xs rounded-r-md font-bold ${prodDiscount.type === 'PERCENTAGE' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>%</button>
                              </div>
                              <div className="col-span-2">
                                {prodDiscount.type === 'PERCENTAGE' ? (
                                  <NumericInput
                                    value={prodDiscount.value}
                                    onChange={(val) => vm.updateProductDiscount(product.id, { ...prodDiscount, value: val })}
                                    min={0}
                                  />
                                ) : (
                                  <MoneyInput
                                    value={prodDiscount.value}
                                    onChange={(val) => vm.updateProductDiscount(product.id, { ...prodDiscount, value: val })}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {product.pricingType === 'HOURLY' && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                              <CustomTimePicker
                                value={selectedProd?.startTime || '09:00'}
                                onChange={(time) => vm.updateHourlyProductTime(product.id, time, 'start')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                              <CustomTimePicker
                                value={selectedProd?.endTime || '10:00'}
                                onChange={(time) => vm.updateHourlyProductTime(product.id, time, 'end')}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Section: Taxas */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Taxas e Encargos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Valor da Taxa Adicional</label>
                  <MoneyInput
                      value={vm.tax}
                      onChange={vm.updateTax}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Descrição da Taxa</label>
                  <input
                    type="text"
                    value={vm.taxDescription}
                    onChange={(e) => vm.updateTaxDescription(e.target.value)}
                    placeholder="Ex: Taxa de limpeza, rolha..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Section: Description */}
            <section className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Descrição / Observações</h2>
              <textarea
                value={vm.observations}
                onChange={(e) => vm.setObservations(e.target.value)}
                placeholder="Adicione informações adicionais sobre o passeio..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
              />
            </section>

          </div>

          {/* Right Column: Empty or Summary could go here, but user wanted it grouped on the left */}
          <aside className="lg:col-span-1 space-y-6 hidden lg:block">
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-4">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Dicas de Uso</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                   <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      Agrupe o agendamento para facilitar a visualização da agenda.
                   </li>
                   <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      Cada produto agora possui seu próprio campo de desconto.
                   </li>
                   <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      A taxa adicional aceita descrição para aparecer no voucher.
                   </li>
                </ul>
             </div>
          </aside>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          {/* Pricing Summary */}
          <div className="flex-grow pr-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Custo do Aluguel da Lancha</span>
              <span className="font-medium">{formatCurrencyBRL(vm.boatRentalCost)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">Subtotal (Produtos)</span>
              <span className="font-medium">{formatCurrencyBRL(vm.subtotal - vm.boatRentalCost)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2 text-red-600">
              <span>Desconto</span>
              <span className="font-medium">- {formatCurrencyBRL(vm.totalDiscount)}</span>
            </div>
            {vm.tax > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>{vm.taxDescription || 'Taxa Adicional'}</span>
                <span className="font-medium">+ {formatCurrencyBRL(vm.tax)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrencyBRL(vm.total)}</span>
            </div>
          </div>
          {/* Action Button */}
          <button
            onClick={() => {
              vm.createEvent().then((client) => {
                showToast(vm.editingEventId ? 'Passeio atualizado com sucesso!' : 'Passeio agendado com sucesso!');
                if (client) {
                  navigate(`/dashboard/clients?clientId=${client.id}`);
                }
              }).catch((err) => {
                console.error('Erro ao salvar evento:', err);
                if (err.message === 'Campos obrigatórios ausentes.') {
                  showToast('Por favor, preencha todos os campos obrigatórios: Data, Cliente, Lancha, Local de Embarque e Tipo de Passeio.');
                } else {
                  showToast('Ocorreu um erro ao salvar o passeio: ' + (err.message || 'Erro desconhecido'));
                }
              });
            }}
            className="px-8 py-4 text-white rounded-lg text-lg font-bold shadow-lg transition-colors bg-blue-600 hover:bg-blue-700"
          >
            {vm.editingEventId ? 'Atualizar Passeio' : 'Agendar Passeio'}
          </button>
        </div>
      </footer>

      <QuickTourTypeModal
        isOpen={isTourTypeModalOpen}
        onSave={vm.handleSaveTourType}
        onClose={() => setIsTourTypeModalOpen(false)}
      />

      <NewClientModal
        isOpen={vm.isModalOpen}
        editingClient={vm.editingClient}
        name={vm.newClientName}
        phone={vm.newClientPhone}
        setName={vm.setNewClientName}
        setPhone={vm.setNewClientPhone}
        onSave={vm.handleSaveClient}
        onClose={vm.handleCloseModal}
        showToast={showToast}
      />
    </div>
  );
};
