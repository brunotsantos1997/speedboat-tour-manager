// src/ui/screens/VoucherScreen.tsx
import React from 'react';
import {
  Anchor,
  User,
  Phone,
  CalendarDays,
  Clock,
  Users,
  Utensils,
  Beer,
  Sailboat,
  Download,
  HelpCircle,
  Package,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

import { useVoucherViewModel } from '../../viewmodels/useVoucherViewModel';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const iconMap: { [key: string]: React.FC<LucideProps> } = { Anchor, Utensils, Beer, User, Circle: HelpCircle, Package };
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-start">
    <Icon className="w-5 h-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- Main Voucher Screen ---

export const VoucherScreen: React.FC = () => {
  const { voucher, companyData, voucherTerms, watermark, isLoading, error, handleDownloadPdf } = useVoucherViewModel();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Carregando voucher...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  if (!voucher || !companyData || !voucherTerms) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Dados do voucher incompletos.</p>
      </div>
    );
  }

  const {
    client,
    date,
    startTime,
    endTime,
    passengerCount,
    boat,
    products,
    subtotal,
    total,
    reservationFee,
    remainingBalance,
    observations,
  } = voucher;

  const watermarkStyle = watermark
    ? {
        backgroundImage: `url(${watermark})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
      }
    : {};

  return (
    <div className="bg-gray-100 p-4 sm:p-8 font-sans">
      <div id="voucher-content" className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl relative">
        <div style={watermarkStyle} className="absolute inset-0 opacity-10"></div>
        <div className="relative">
          {/* Header */}
          <header className="p-6 sm:p-8 bg-gray-800 text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <Sailboat className="w-10 h-10 mr-4"/>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{companyData.appName}</h1>
                <p className="text-xs sm:text-sm text-gray-300">CNPJ: {companyData.cnpj} | {companyData.phone}</p>
              </div>
            </div>
            <button
              id="download-pdf-button"
              onClick={handleDownloadPdf}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>
          </header>

          <main className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Voucher de Confirmação de Reserva
            </h2>

            {/* Client and Event Details */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 pb-8 mb-8">
              <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-700">Dados do Cliente</h3>
                  <div className="space-y-4">
                      <InfoItem icon={User} label="Nome" value={client.name} />
                      <InfoItem icon={Phone} label="Telefone" value={client.phone} />
                  </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-700">Detalhes do Evento</h3>
                   <div className="space-y-4">
                      <InfoItem icon={CalendarDays} label="Data" value={new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
                      <InfoItem icon={Clock} label="Horário" value={`${startTime} - ${endTime}`} />
                      <InfoItem icon={Users} label="Nº de Passageiros" value={`${passengerCount} pessoas`} />
                      <InfoItem icon={Anchor} label="Lancha" value={`${boat.name} (Cap: ${boat.capacity})`} />
                  </div>
              </div>
            </section>

            {/* Included Items */}
            <section className="mb-8">
              <h3 className="font-bold text-lg mb-4 text-gray-700">Itens Inclusos no Pacote</h3>
              <div className="space-y-3">
                {products.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <DynamicIcon name={item.iconKey} className="w-6 h-6 mr-4 text-blue-600" />
                      <div>
                          <p className="font-semibold text-gray-800">
                              {item.name}
                              {item.isCourtesy && <span className="text-sm font-normal text-green-600 ml-2">(Cortesia)</span>}
                          </p>
                           {item.pricingType === 'HOURLY' && item.startTime && item.endTime && (
                              <p className="text-xs text-gray-500">
                                  Horário: {item.startTime} - {item.endTime}
                              </p>
                          )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${item.isCourtesy ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.pricingType === 'PER_PERSON' && !item.isCourtesy
                          ? `R$ ${((item.price || 0) * passengerCount).toFixed(2)}`
                          : `R$ ${(item.price || 0).toFixed(2)}`}
                      </p>
                      {item.pricingType === 'PER_PERSON' && (
                        <p className="text-xs text-gray-500">
                          {item.isCourtesy ? "" : `(${passengerCount}x R$ ${(item.price || 0).toFixed(2)})`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Observations */}
            {observations && (
              <section className="mb-8">
                <h3 className="font-bold text-lg mb-4 text-gray-700">Observações</h3>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{observations}</p>
                </div>
              </section>
            )}

            {/* Financial Summary */}
            <section className="flex justify-end mb-8">
              <div className="w-full max-w-sm">
                  <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between"><span>Subtotal</span> <span className="font-medium">R$ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-red-600"><span>Desconto</span> <span className="font-medium">- R$ {(voucher.discount.type === 'FIXED' ? voucher.discount.value : subtotal * (voucher.discount.value / 100)).toFixed(2)}</span></div>
                      {voucher.tax > 0 && <div className="flex justify-between text-green-600"><span>Taxa</span> <span className="font-medium">+ R$ {voucher.tax.toFixed(2)}</span></div>}
                      <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2"><span>Total</span> <span>R$ {total.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-lg text-blue-600 bg-blue-50 p-3 rounded-lg">
                          <span>Sinal (Reserva 30%)</span>
                          <span>R$ {reservationFee.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between text-gray-600 pt-2 mt-2">
                          <span>Saldo a pagar no dia</span>
                          <span className="font-bold">R$ {remainingBalance.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
            </section>

            {/* Legal Clauses */}
            <section className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4 text-gray-700">Termos e Condições</h3>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {voucherTerms.terms}
              </div>
            </section>
          </main>

          <footer className="text-center p-4 text-xs text-gray-500 bg-gray-100 rounded-b-lg">
              <p>Este é um documento de confirmação gerado digitalmente.</p>
              <p>{companyData.appName} &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};
