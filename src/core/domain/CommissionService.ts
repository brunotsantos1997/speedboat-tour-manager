// src/core/domain/CommissionService.ts
import type { EventType, Expense } from './types';
import type { User, UserCommissionSettings } from './User';
import { CompanyDataRepository } from '../repositories/CompanyDataRepository';
import { logger } from '../common/Logger';

export interface CommissionCalculation {
  commissionValue: number;
  rentalBaseValue: number;
  productBaseValue: number;
  taxBaseValue: number;
  breakdown: {
    rental: number;
    product: number;
    tax: number;
  };
}

export class CommissionService {
  /**
   * Centralized commission calculation - replaces text-based detection
   */
  static async calculateCommission(
    event: EventType,
    user: User
  ): Promise<CommissionCalculation> {
    // Use structured commission settings if available
    if (user.commissionSettings) {
      return this.calculateStructuredCommission(event, user.commissionSettings, user);
    }

    // Legacy calculation for backward compatibility
    return this.calculateLegacyCommission(event, user);
  }

  private static calculateStructuredCommission(
    event: EventType,
    settings: UserCommissionSettings,
    user: User
  ): CommissionCalculation {
    const calculation: CommissionCalculation = {
      commissionValue: 0,
      rentalBaseValue: 0,
      productBaseValue: 0,
      taxBaseValue: 0,
      breakdown: { rental: 0, product: 0, tax: 0 }
    };

    // Calculate extra rental costs
    const extraRentalCost = (event.additionalCosts || [])
      .filter(c => c.category === 'RENTAL')
      .reduce((acc, c) => acc + c.amount, 0);

    // Rental commission
    if (settings.rentalEnabled) {
      let rentalBase = settings.rentalBase === 'GROSS' 
        ? (event.rentalGross || 0) 
        : (event.rentalRevenue || 0);
      
      if (settings.deductRentalCost) {
        rentalBase = Math.max(0, rentalBase - (event.rentalCost || 0) - extraRentalCost);
      }

      calculation.breakdown.rental = rentalBase * (settings.rentalPercentage / 100);
      calculation.rentalBaseValue = rentalBase;
    }

    // Product commission
    if (settings.productEnabled) {
      let productBase = settings.productBase === 'GROSS' 
        ? (event.productsGross || 0) 
        : (event.productsRevenue || 0);
      
      if (settings.deductProductCost) {
        productBase = Math.max(0, productBase - (event.productsCost || 0));
      }

      calculation.breakdown.product = productBase * (settings.productPercentage / 100);
      calculation.productBaseValue = productBase;
    }

    // Tax commission
    if (settings.taxEnabled) {
      const taxBase = (event.tax || 0);
      calculation.breakdown.tax = taxBase * (settings.taxPercentage / 100);
      calculation.taxBaseValue = taxBase;
    }

    calculation.commissionValue = 
      calculation.breakdown.rental + 
      calculation.breakdown.product + 
      calculation.breakdown.tax;

    logger.debug(`Commission calculated for event ${event.id}`, {
      eventId: event.id,
      userId: user.id,
      commissionValue: calculation.commissionValue,
      breakdown: calculation.breakdown
    });

    return calculation;
  }

  private static async calculateLegacyCommission(
    event: EventType,
    user: User
  ): Promise<CommissionCalculation> {
    const companyData = await CompanyDataRepository.getInstance().get();
    const useTotalForCommission = companyData?.commissionBasis === 'TOTAL_PRICE';
    
    const baseValue = useTotalForCommission 
      ? event.total 
      : (event.rentalRevenue || 0);
    
    const commissionValue = baseValue * ((user.commissionPercentage || 0) / 100);

    const calculation: CommissionCalculation = {
      commissionValue,
      rentalBaseValue: baseValue,
      productBaseValue: 0,
      taxBaseValue: 0,
      breakdown: { rental: commissionValue, product: 0, tax: 0 }
    };

    logger.debug(`Legacy commission calculated for event ${event.id}`, {
      eventId: event.id,
      userId: user.id,
      commissionValue,
      baseValue,
      useTotalForCommission
    });

    return calculation;
  }

  /**
   * Check if commission has been paid (replaces text-based detection)
   */
  static isCommissionPaid(eventId: string, expenses: Expense[]): boolean {
    const commissionExpense = expenses.find(exp =>
      !exp.isArchived &&
      exp.eventId === eventId &&
      exp.categoryId === 'COMMISSION'
    );

    const isPaid = !!commissionExpense;

    logger.debug(`Commission payment status for event ${eventId}`, {
      eventId,
      isPaid,
      expenseId: commissionExpense?.id
    });

    return isPaid;
  }

  /**
   * Create commission expense entry
   */
  static createCommissionExpense(
    eventId: string,
    commission: CommissionCalculation,
    userName: string
  ): Omit<Expense, 'id'> {
    return {
      date: new Date().toISOString().split('T')[0],
      amount: commission.commissionValue,
      description: `Comissão: ${userName} - Evento ${eventId}`,
      categoryId: 'COMMISSION',
      status: 'PENDING',
      paymentMethod: 'OTHER',
      timestamp: Date.now(),
      eventId,
      isArchived: false
    };
  }

  /**
   * Validate commission settings
   */
  static validateCommissionSettings(settings: UserCommissionSettings): string[] {
    const errors: string[] = [];

    if (settings.rentalEnabled && settings.rentalPercentage < 0) {
      errors.push('Rental commission percentage cannot be negative');
    }

    if (settings.productEnabled && settings.productPercentage < 0) {
      errors.push('Product commission percentage cannot be negative');
    }

    if (settings.taxEnabled && settings.taxPercentage < 0) {
      errors.push('Tax commission percentage cannot be negative');
    }

    if (settings.rentalPercentage > 100 || settings.productPercentage > 100 || settings.taxPercentage > 100) {
      errors.push('Commission percentages cannot exceed 100%');
    }

    return errors;
  }
}
