// src/viewmodels/useVoucherTermsViewModel.ts
import { useState, useEffect } from 'react';

const VOUCHER_TERMS_KEY = 'voucherTerms';

export const useVoucherTermsViewModel = () => {
  const [terms, setTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from a repository
    const savedTerms = localStorage.getItem(VOUCHER_TERMS_KEY);
    if (savedTerms) {
      setTerms(savedTerms);
    } else {
      // Set default terms if none are saved
      setTerms(`
        <h2>Termos e Condições</h2>
        <p><strong>1. Cancelamento e Reembolso:</strong> O cancelamento com reembolso de 100% do sinal é permitido apenas se feito com 7 dias de antecedência. Após este período, o sinal não é reembolsável.</p>
        <p><strong>2. Condições Climáticas:</strong> Condições climáticas adversas (chuva forte, ventos perigosos) podem levar ao reagendamento do passeio sem custo adicional, a ser combinado entre as partes.</p>
        <p><strong>3. Responsabilidade:</strong> Danos causados à embarcação por mau uso dos passageiros são de responsabilidade do contratante.</p>
        <p><strong>4. Embarque:</strong> O embarque ocorrerá no local e horário combinados. É recomendado chegar com 15 minutos de antecedência. A tolerância de atraso é de 10 minutos.</p>
      `);
    }
    setIsLoading(false);
  }, []);

  const saveTerms = async (content: string) => {
    // Simulate saving to a repository
    localStorage.setItem(VOUCHER_TERMS_KEY, content);
    setTerms(content);
    return Promise.resolve();
  };

  return {
    terms,
    isLoading,
    saveTerms,
  };
};
