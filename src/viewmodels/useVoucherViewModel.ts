// src/viewmodels/useVoucherViewModel.ts
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { EventType, CompanyData, VoucherTerms } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import html2pdf from 'html2pdf.js';

interface VoucherDetails extends EventType {
  reservationFee: number;
  remainingBalance: number;
}

export const useVoucherViewModel = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [voucherTerms, setVoucherTerms] = useState<VoucherTerms | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucherData = async () => {
      if (!eventId) {
        setError('ID do evento não fornecido.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const companyRepo = CompanyDataRepository.getInstance();
        const termsRepo = VoucherTermsRepository.getInstance();
        const appearanceRepo = VoucherAppearanceRepository.getInstance();

        // Use Promise.allSettled to catch individual failures but try to proceed
        const results = await Promise.allSettled([
          companyRepo.get(),
          termsRepo.get(),
          appearanceRepo.get(),
          eventRepository.getById(eventId),
        ]);

        const companyInfo = results[0].status === 'fulfilled' ? results[0].value : {
          id: 'default',
          cnpj: '',
          phone: '',
          appName: 'Voucher Online',
          reservationFeePercentage: 30,
          businessHours: {} as any,
          eventIntervalMinutes: 30,
        } as CompanyData;

        const terms = results[1].status === 'fulfilled' ? results[1].value : {
          id: 'default',
          terms: '<p>Termos e condições de uso do voucher.</p>'
        } as VoucherTerms;

        const appearance = results[2].status === 'fulfilled' ? results[2].value : undefined;
        const eventData = results[3].status === 'fulfilled' ? results[3].value : undefined;

        if (results[3].status === 'rejected') {
          const error = results[3].reason;
          if (error?.code === 'permission-denied') {
            setError('Acesso negado ao voucher. Verifique se o link está correto ou se as permissões do banco de dados permitem acesso público.');
          } else {
            setError('Falha ao buscar os detalhes do evento.');
          }
          return;
        }

        if (!eventData) {
          setError('Evento não encontrado ou ID inválido.');
          return;
        }

        if (companyInfo) setCompanyData(companyInfo);
        if (terms) setVoucherTerms(terms);
        if (appearance) setWatermark(appearance?.watermarkImage || null);

        const feePercentage = (companyInfo?.reservationFeePercentage || 30) / 100;
        const reservationFee = eventData.total * feePercentage;
        const remainingBalance = eventData.total - reservationFee;

        setVoucher({ ...eventData, reservationFee, remainingBalance });

      } catch (err) {
        setError('Falha ao buscar os detalhes do voucher.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoucherData();
  }, [eventId]);

  const handleDownloadPdf = () => {
    const element = document.getElementById('voucher-content');
    const button = document.getElementById('download-pdf-button');
    if (element && voucher) {
      if (button) button.style.display = 'none';

      const opt = {
        margin: 0.5,
        filename: `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        if (button) button.style.display = 'flex';
      });
    }
  };

  return {
    voucher,
    companyData,
    voucherTerms,
    watermark,
    isLoading,
    error,
    handleDownloadPdf,
  };
};
