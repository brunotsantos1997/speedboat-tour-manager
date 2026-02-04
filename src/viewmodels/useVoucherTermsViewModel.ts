// src/viewmodels/useVoucherTermsViewModel.ts
import { useState, useEffect } from 'react';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';

export const useVoucherTermsViewModel = () => {
  const [terms, setTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const repository = VoucherTermsRepository.getInstance();

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const data = await repository.get();
        if (data && data.terms && data.terms !== 'Termos padrão...') {
          setTerms(data.terms);
        } else {
          // Set default terms if none are saved or it's the repository's default
          setTerms(`
            <h2>Termos e Condições</h2>
            <p><strong>1. Cancelamento e Reembolso:</strong> O cancelamento com reembolso de 100% do sinal é permitido apenas se feito com 7 dias de antecedência. Após este período, o sinal não é reembolsável.</p>
            <p><strong>2. Condições Climáticas:</strong> Condições climáticas adversas (chuva forte, ventos perigosos) podem levar ao reagendamento do passeio sem custo adicional, a ser combinado entre as partes.</p>
            <p><strong>3. Responsabilidade:</strong> Danos causados à embarcação por mau uso dos passageiros são de responsabilidade do contratante.</p>
            <p><strong>4. Embarque:</strong> O embarque ocorrerá no local e horário combinados. É recomendado chegar com 15 minutos de antecedência. A tolerância de atraso é de 10 minutos.</p>
          `);
        }
      } catch (error) {
        console.error("Error loading voucher terms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTerms();
  }, []);

  const saveTerms = async (content: string) => {
    try {
      await repository.update({ id: 'default', terms: content });
      setTerms(content);
    } catch (error) {
      console.error("Error saving voucher terms:", error);
      throw error;
    }
  };

  return {
    terms,
    isLoading,
    saveTerms,
  };
};
