import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const isRTL = ['ar', 'he', 'fa'].includes(currentLanguage); // Para futuros idiomas RTL

  const formatCurrency = (amount: number, currency?: string) => {
    const currencyMap: { [key: string]: string } = {
      'pt-BR': 'BRL',
      'en-US': 'USD',
      'es-ES': 'EUR'
    };

    const currencyCode = currency || currencyMap[currentLanguage] || 'USD';
    
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat(currentLanguage, defaultOptions).format(dateObj);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(currentLanguage, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const defaultOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };

    return new Intl.NumberFormat(currentLanguage, defaultOptions).format(number);
  };

  const getRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('date.today');
    if (diffDays === 1) return t('date.yesterday');
    if (diffDays === -1) return t('date.tomorrow');
    
    return formatDate(dateObj);
  };

  const changeLanguageWithStorage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  return {
    t,
    currentLanguage,
    isRTL,
    changeLanguage: changeLanguageWithStorage,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    getRelativeTime
  };
}
