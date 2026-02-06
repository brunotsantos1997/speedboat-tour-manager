// src/ui/components/PaymentModal.tsx
import React, { useState } from 'react';
import { X, Smartphone, CreditCard, DollarSign, Landmark, Receipt } from 'lucide-react';
import { MoneyInput } from './MoneyInput';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import type { PaymentMethod, PaymentType } from '../../core/domain/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: PaymentMethod, type: PaymentType) => Promise<void>;
  title: string;
  defaultAmount: number;
  type: PaymentType;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  defaultAmount,
  type
}) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(amount, method, type);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const methods: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: 'PIX', label: 'PIX', icon: Smartphone },
    { value: 'CARD_CREDIT', label: 'Crédito', icon: CreditCard },
    { value: 'CARD_DEBIT', label: 'Débito', icon: CreditCard },
    { value: 'CASH', label: 'Dinheiro', icon: DollarSign },
    { value: 'TRANSFER', label: 'Transf.', icon: Landmark },
    { value: 'OTHER', label: 'Outro', icon: Receipt },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Pagamento</label>
            <MoneyInput value={amount} onChange={setAmount} />
            <p className="text-xs text-gray-500 mt-2">
              Sugerido: <button onClick={() => setAmount(defaultAmount)} className="text-blue-600 hover:underline font-medium">{formatCurrencyBRL(defaultAmount)}</button>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Método de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-sm ${
                    method === m.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <m.icon size={18} />
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || amount <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
