// src/ui/screens/VoucherScreen.tsx
import React from 'react';
import {
  Anchor,
  User,
  CalendarDays,
  Clock,
  Users,
  Utensils,
  Beer,
  Sailboat,
  Download,
  HelpCircle,
  Package,
  MapPin,
  ExternalLink,
  Tag,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

import { useVoucherViewModel } from '../../viewmodels/useVoucherViewModel';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import DOMPurify from 'dompurify';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const iconMap: { [key: string]: React.FC<LucideProps> } = { Anchor, Utensils, Beer, User, Circle: HelpCircle, Package };
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-start">
    <Icon className="w-5 h-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  const parts = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);

  return parts.length > 0 ? parts.join(' e ') : '0 minutos';
};

// --- Main Voucher Screen ---

export const VoucherScreen: React.FC = () => {
  const { voucher, companyData, voucherTerms, watermark, isLoading, error, handleDownloadPdf } = useVoucherViewModel();

  const boatRentalGross = React.useMemo(() => {
    if (!voucher || !voucher.boat) return 0;
    const hours = Math.floor(voucher.durationHours);
    const mins = Math.round((voucher.durationHours - hours) * 60);
    let cost = hours * (voucher.boat.pricePerHour || 0);
    if (mins >= 30) cost += (voucher.boat.pricePerHalfHour || 0);
    return cost;
  }, [voucher]);

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
    remainingBalance,
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
                      {voucher.observations && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                           <p className="text-xs font-bold text-blue-600 uppercase mb-1">Descrição do Passeio</p>
                           <p className="text-sm text-gray-700 whitespace-pre-wrap">{voucher.observations}</p>
                        </div>
                      )}
                  </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-700">Detalhes do Evento</h3>
                   <div className="space-y-4">
                      <InfoItem icon={CalendarDays} label="Data" value={new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
                      <InfoItem icon={Clock} label="Horário" value={`${startTime} - ${endTime}`} />
                      <InfoItem icon={Users} label="Nº de Passageiros" value={`${passengerCount} pessoas`} />
                      <InfoItem icon={Tag} label="Tipo de Passeio" value={voucher.tourType?.name || 'Passeio'} />
                      <InfoItem icon={Anchor} label="Lancha" value={boat.name} />
                      <InfoItem
                        icon={MapPin}
                        label="Local de Embarque"
                        value={
                          voucher.boardingLocation.mapLink ? (
                            <a
                              href={voucher.boardingLocation.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              {voucher.boardingLocation.name}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          ) : (
                            voucher.boardingLocation.name
                          )
                        }
                      />
                  </div>
              </div>
            </section>

            {/* Included Items */}
            <section className="mb-8">
              <h3 className="font-bold text-lg mb-4 text-gray-700">Itens Inclusos no Pacote</h3>
              <div className="space-y-3">
                {/* Boat Package Duration */}
                <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center">
                    <Anchor className="w-6 h-6 mr-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Pacote de {formatDuration(voucher.durationHours)} de passeio
                      </p>
                      <p className="text-xs text-gray-500">
                        {boat.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {formatCurrencyBRL(boatRentalGross)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({formatCurrencyBRL(boat.pricePerHour)}/h)
                    </p>
                  </div>
                </div>

                {products.map((item) => {
                  const itemGross = item.pricingType === 'PER_PERSON'
                    ? (item.price || 0) * passengerCount
                    : (item.price || 0);

                  let itemDiscountValue = 0;
                  if (item.discount && item.discount.value > 0 && !item.isCourtesy) {
                    if (item.discount.type === 'FIXED') itemDiscountValue = item.discount.value;
                    else itemDiscountValue = itemGross * (item.discount.value / 100);
                  }

                  const itemNet = Math.max(0, itemGross - itemDiscountValue);

                  return (
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
                          {item.isCourtesy ? formatCurrencyBRL(itemGross) : formatCurrencyBRL(itemNet)}
                        </p>
                        {item.pricingType === 'PER_PERSON' && !item.isCourtesy && (
                          <p className="text-xs text-gray-500">
                            ({passengerCount}x {formatCurrencyBRL(item.price || 0)})
                          </p>
                        )}
                        {itemDiscountValue > 0 && !item.isCourtesy && (
                          <p className="text-xs text-red-500">
                            Desc: -{formatCurrencyBRL(itemDiscountValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Financial Summary */}
            <section className="flex justify-end mb-8">
              <div className="w-full max-w-sm">
                  <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between"><span>Subtotal</span> <span className="font-medium">{formatCurrencyBRL(subtotal)}</span></div>
                      {/* Granular Discounts Display */}
                      {voucher.rentalDiscount && voucher.rentalDiscount.value > 0 && (
                        <div className="flex justify-between text-red-600 text-sm italic">
                          <span>Desconto Lancha</span>
                          <span className="font-medium">- {formatCurrencyBRL(voucher.rentalDiscount.type === 'FIXED' ? voucher.rentalDiscount.value : (boat.pricePerHour * voucher.durationHours) * (voucher.rentalDiscount.value / 100))}</span>
                        </div>
                      )}
                      {/* Per-Product Discounts Summary (Optional, but showing total discounts is good) */}
                      {(() => {
                        const productDiscountsTotal = products.reduce((acc, p) => {
                          if (p.isCourtesy || !p.discount || p.discount.value <= 0) return acc;
                          let itemGross = p.pricingType === 'PER_PERSON' ? (p.price || 0) * passengerCount : (p.price || 0);
                          if (p.discount.type === 'FIXED') return acc + p.discount.value;
                          return acc + (itemGross * (p.discount.value / 100));
                        }, 0);

                        if (productDiscountsTotal > 0) {
                          return (
                            <div className="flex justify-between text-red-600 text-sm italic">
                              <span>Desconto nos Itens</span>
                              <span className="font-medium">- {formatCurrencyBRL(productDiscountsTotal)}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {(voucher.tax ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="italic flex flex-col">
                            <span>Taxa Adicional</span>
                            {voucher.taxDescription && <span className="text-[10px] text-gray-500">Motivo: {voucher.taxDescription}</span>}
                          </span>
                          <span className="font-medium">+ {formatCurrencyBRL(voucher.tax ?? 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                        <span>Total</span>
                        <div className="flex items-center gap-2">
                          {voucher.isFullyPaid && <span className="text-green-600 text-sm font-bold uppercase tracking-wider">Pago</span>}
                          <span className={voucher.isFullyPaid ? "line-through opacity-50" : ""}>{formatCurrencyBRL(total)}</span>
                        </div>
                      </div>

                      {/* Signal (Down Payment) Logic */}
                      {voucher.totalPaid > 0 ? (
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-lg text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                              <span className="flex items-center gap-2">
                                <span className="text-sm uppercase tracking-wider">Pago</span>
                                <span>Sinal Antecipado</span>
                              </span>
                              <span className="line-through opacity-60">{formatCurrencyBRL(voucher.totalPaid)}</span>
                          </div>

                          {voucher.remainingReservationFee > 0 && (
                            <div className="flex justify-between font-bold text-md text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span>Sinal Pendente (Reserva)</span>
                                <span>{formatCurrencyBRL(voucher.remainingReservationFee)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-between font-bold text-lg text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <span>Sinal (Reserva {companyData.reservationFeePercentage || 30}%)</span>
                            <span>{formatCurrencyBRL(voucher.reservationFee)}</span>
                        </div>
                      )}

                       <div className="flex justify-between text-gray-600 pt-2 mt-2">
                          <span>Saldo a pagar no dia</span>
                          <div className="flex items-center gap-2">
                            {(voucher.status === 'COMPLETED' || voucher.status === 'ARCHIVED_COMPLETED') && voucher.remainingBalance <= 0 && (
                                <span className="text-green-600 text-xs font-bold uppercase">Pago</span>
                            )}
                            <span className={`font-bold ${(voucher.status === 'COMPLETED' || voucher.status === 'ARCHIVED_COMPLETED') && voucher.remainingBalance <= 0 ? "line-through opacity-50" : ""}`}>
                                {formatCurrencyBRL(remainingBalance)}
                            </span>
                          </div>
                      </div>
                  </div>
              </div>
            </section>

            {/* Observations Section (Keep it but rename) */}
            {voucher.observations && (
              <section className="mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-gray-700">Notas Adicionais</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{voucher.observations}</p>
              </section>
            )}

            {/* Legal Clauses */}
            <section className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4 text-gray-700">Termos e Condições</h3>
              <style>{`
                .voucher-terms h2 { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
                .voucher-terms p { margin-bottom: 0.5rem; }
                .voucher-terms ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
                .voucher-terms li { margin-bottom: 0.25rem; }
                .voucher-terms hr { margin: 1rem 0; border: 0; border-top: 1px solid #e5e7eb; }
              `}</style>
              <div
                className="text-sm text-gray-600 voucher-terms"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(voucherTerms.terms) }}
              />
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
