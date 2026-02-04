// src/core/utils/currencyUtils.ts

/**
 * Formats a number as BRL currency (e.g., R$ 1.234,56)
 */
export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a number using Brazilian decimal and thousand separators without the R$ symbol
 */
export const formatNumberBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Parses a BRL formatted string back to a number
 */
export const parseCurrencyBRL = (value: string): number => {
  if (!value) return 0;

  // Remove everything except digits and comma
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};
