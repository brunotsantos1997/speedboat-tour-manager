// src/ui/components/SharedEventModal.tsx
import React, { useState } from 'react';
import { useSharedEventViewModel } from '../../viewmodels/useSharedEventViewModel';
import { MoneyInput } from './MoneyInput';
import { X, Anchor, Users, Clock, Calendar, CreditCard, MessageSquare } from 'lucide-react';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';

interface SharedEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SharedEventModal: React.FC<SharedEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    selectedBoat,
    setSelectedBoat,
    passengerCount,
    setPassengerCount,
    costPerPerson,
    setCostPerPerson,
    discountPerPerson,
    setDiscountPerPerson,
    generalDiscount,
    setGeneralDiscount,
    paymentMethod,
    setPaymentMethod,
    observations,
    setObservations,
    availableBoats,
    availableTimeSlots,
    subtotal,
    totalDiscount,
    total,
    existingSharedEvent,
    createSharedEvent
  } = useSharedEventViewModel();

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await createSharedEvent();
    setIsSaving(false);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-blue-600" /> Criar Passeio Compartilhado
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando dados...</div>
        ) : (
          <div className="p-6 space-y-6">
            {existingSharedEvent && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Já existe um passeio compartilhado para este horário.
                      <span className="font-bold"> O novo grupo será adicionado ao passeio existente.</span>
                      <br />
                      Ocupação atual: {existingSharedEvent.passengerCount} pessoas.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Boat Selection */}
              <div>
                <label htmlFor="boat-select" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Anchor size={16} className="mr-2 text-gray-400" /> Barco
                </label>
                <select
                  id="boat-select"
                  value={selectedBoat?.id || ''}
                  onChange={(e) => {
                    const boat = availableBoats.find(b => b.id === e.target.value);
                    if (boat) setSelectedBoat(boat);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {availableBoats.map(boat => (
                    <option key={boat.id} value={boat.id}>{boat.name} (Cap: {boat.capacity})</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" /> Data
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00'))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" /> Horário de Início
                </label>
                <select
                  id="start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))
                  ) : (
                    <option disabled>Nenhum horário disponível</option>
                  )}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration-hours" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" /> Duração (Horas)
                </label>
                <select
                  id="duration-hours"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? 'hora' : 'horas'}</option>
                  ))}
                </select>
              </div>

              {/* Passengers */}
              <div>
                <label htmlFor="passenger-count" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Users size={16} className="mr-2 text-gray-400" /> Número de Passageiros
                </label>
                <input
                  id="passenger-count"
                  type="number"
                  min="1"
                  max={selectedBoat?.capacity || 100}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Cost Per Person */}
              <MoneyInput
                label="Custo por Pessoa"
                value={costPerPerson}
                onChange={setCostPerPerson}
                id="cost-per-person"
              />

              {/* Discount Per Person */}
              <MoneyInput
                label="Desconto por Pessoa"
                value={discountPerPerson}
                onChange={setDiscountPerPerson}
                id="discount-per-person"
              />

              {/* General Discount */}
              <MoneyInput
                label="Desconto Geral"
                value={generalDiscount}
                onChange={setGeneralDiscount}
                id="general-discount"
              />

              {/* Payment Method */}
              <div>
                <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <CreditCard size={16} className="mr-2 text-gray-400" /> Método de Pagamento
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="PIX">PIX</option>
                  <option value="CARD_CREDIT">Cartão de Crédito</option>
                  <option value="CARD_DEBIT">Cartão de Débito</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </div>

            {/* Observations */}
            <div>
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MessageSquare size={16} className="mr-2 text-gray-400" /> Observações
              </label>
              <textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Detalhes adicionais..."
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({passengerCount} x {formatCurrencyBRL(costPerPerson)})</span>
                <span>{formatCurrencyBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Total de Descontos</span>
                <span>- {formatCurrencyBRL(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                <span>Total a Pagar</span>
                <span>{formatCurrencyBRL(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || (availableTimeSlots.length === 0 && !existingSharedEvent)}
                className={`px-8 py-2 rounded-lg font-bold transition-all shadow-md disabled:bg-gray-400 disabled:shadow-none text-white ${
                  existingSharedEvent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? (existingSharedEvent ? 'Salvando...' : 'Criando...') : (existingSharedEvent ? 'Adicionar ao Passeio' : 'Confirmar e Pagar')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
