// src/viewmodels/useVoucherViewModel.ts
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Event, CompanyData, VoucherTerms } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import html2pdf from 'html2pdf.js';

interface VoucherDetails extends Event {
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

        // This logic is now centralized in the view model
        const companyRepo = CompanyDataRepository.getInstance();
        const termsRepo = VoucherTermsRepository.getInstance();
        const appearanceRepo = VoucherAppearanceRepository.getInstance();

        const [companyInfo, terms, appearance, eventData] = await Promise.all([
          companyRepo.get(),
          termsRepo.get(),
          appearanceRepo.get(),
          eventRepository.getById(eventId),
        ]);

        if (!eventData) {
          setError('Evento não encontrado.');
          return;
        }

        setCompanyData(companyInfo);
        setVoucherTerms(terms);
        setWatermark(appearance.watermarkImage);

        const feePercentage = (companyInfo.reservationFeePercentage || 30) / 100;
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
      // Hide the button before generating the PDF
      if (button) button.style.display = 'none';

      const opt = {
        margin: 0.5,
        filename: `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        // Show the button again after the PDF is generated
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
