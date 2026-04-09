// src/viewmodels/event/useEventCalculations.ts
import { useMemo } from 'react';
import type { Boat, Discount, SelectedProduct } from '../../core/domain/types';
import { timeToMinutes } from '../../core/utils/timeUtils';

export const useEventCalculations = (
  selectedBoat: Boat | null,
  selectedProducts: SelectedProduct[],
  rentalDiscount: Discount,
  passengerCount: number,
  tax: number,
  startTime: string,
  endTime: string
) => {
  const calculations = useMemo(() => {
    // Base calculations
    const baseRentalPrice = selectedBoat?.pricePerHour || 0;
    const durationHours = Math.max(1, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60);

    // Rental calculations
    let rentalGross = 0;
    let rentalRevenue = 0;
    let rentalDiscountAmount = 0;

    // Always use hourly pricing for boats
    rentalGross = baseRentalPrice * durationHours;

    // Apply rental discount
    if (rentalDiscount.type === 'FIXED') {
      rentalDiscountAmount = rentalDiscount.value;
      rentalRevenue = Math.max(0, rentalGross - rentalDiscount.value);
    } else {
      rentalDiscountAmount = rentalGross * (rentalDiscount.value / 100);
      rentalRevenue = Math.max(0, rentalGross - rentalDiscountAmount);
    }

    // Product calculations
    let productsGross = 0;
    let productsRevenue = 0;
    let productsCost = 0;

    selectedProducts.forEach(product => {
      if (product.isCourtesy) return;

      let productPrice = 0;
      const productCost = product.snapshotCost || 0;

      // Calculate product price based on pricing type
      if (product.pricingType === 'PER_PERSON') {
        productPrice = (product.price || 0) * passengerCount;
      } else if (product.pricingType === 'FIXED') {
        productPrice = product.price || 0;
      } else if (product.pricingType === 'HOURLY' && product.startTime && product.endTime) {
        const productDuration = (timeToMinutes(product.endTime) - timeToMinutes(product.startTime)) / 60;
        productPrice = (product.hourlyPrice || 0) * productDuration;
      }

      // Apply product discount
      if (product.discount) {
        if (product.discount.type === 'FIXED') {
          productPrice = Math.max(0, productPrice - product.discount.value);
        } else {
          productPrice = Math.max(0, productPrice * (1 - product.discount.value / 100));
        }
      }

      productsGross += productPrice;
      productsRevenue += productPrice;
      productsCost += productCost;
    });

    // Tax calculation
    const taxCost = tax;

    // Totals
    const subtotal = rentalRevenue + productsRevenue;
    const total = subtotal + taxCost;

    // Discount summary
    const totalDiscounts = rentalDiscountAmount + 
      selectedProducts.reduce((acc, p) => {
        if (!p.discount || p.isCourtesy) return acc;
        if (p.discount.type === 'FIXED') return acc + p.discount.value;
        return acc + (p.price || 0) * (p.discount.value / 100);
      }, 0);

    return {
      // Individual components
      rentalGross,
      rentalRevenue,
      rentalDiscountAmount,
      productsGross,
      productsRevenue,
      productsCost,
      taxCost,

      // Totals
      subtotal,
      total,
      totalDiscounts,

      // Metadata
      durationHours,
      passengerCount,
      selectedBoatName: selectedBoat?.name || '',
      selectedProductsCount: selectedProducts.filter(p => !p.isCourtesy).length,
      courtesyProductsCount: selectedProducts.filter(p => p.isCourtesy).length,
    };
  }, [
    selectedBoat,
    selectedProducts,
    rentalDiscount,
    passengerCount,
    tax,
    startTime,
    endTime,
  ]);

  return calculations;
};
