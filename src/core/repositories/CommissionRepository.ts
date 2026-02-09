// src/core/repositories/CommissionRepository.ts
import type { CommissionReportEntry } from '../domain/types';
import { eventRepository } from './EventRepository';
import { expenseRepository } from './ExpenseRepository';
import { companyDataRepository } from './CompanyDataRepository';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User } from '../domain/User';

export interface ICommissionRepository {
  getCommissionReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CommissionReportEntry[]>;
}

class CommissionRepository implements ICommissionRepository {
  async getCommissionReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CommissionReportEntry[]> {
    const allEvents = await eventRepository.getAll();

    // Fetch all users/profiles
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const allUsers = profilesSnap.docs.map(doc => ({ ...doc.data() as User, id: doc.id }));

    const userMap = new Map<string, User>(allUsers.map(user => [user.id, user]));

    // Fetch all expenses to check for payments
    const allExpenses = await expenseRepository.getAll();

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];

    const filteredEvents = allEvents.filter(event => {
      if (!confirmedStatuses.includes(event.status)) {
        return false;
      }
      const eventDate = new Date(event.date + 'T00:00:00');
      const isAfterStartDate = eventDate >= startDate;
      const isBeforeEndDate = eventDate <= endDate;
      const matchesUser = !userId || event.createdByUserId === userId;

      return isAfterStartDate && isBeforeEndDate && matchesUser;
    });

    const report: CommissionReportEntry[] = [];

    const companyData = await companyDataRepository.get();

    for (const event of filteredEvents) {
      if (event.createdByUserId) {
        const user = userMap.get(event.createdByUserId);
        if (user && (user.commissionPercentage || user.commissionSettings)) {
          let commissionValue = 0;
          let rentalBaseValue = 0;

          if (user.commissionSettings) {
            const settings = user.commissionSettings;

            const extraRentalCost = (event.additionalCosts || [])
              .filter(c => c.category === 'RENTAL')
              .reduce((acc, c) => acc + c.amount, 0);
            const extraProductCost = (event.additionalCosts || [])
              .filter(c => c.category === 'PRODUCT')
              .reduce((acc, c) => acc + c.amount, 0);
            const extraTaxCost = (event.additionalCosts || [])
              .filter(c => c.category === 'TAX')
              .reduce((acc, c) => acc + c.amount, 0);

            if (settings.rentalEnabled) {
              let base = settings.rentalBase === 'GROSS' ? (event.rentalGross || 0) : (event.rentalRevenue || 0);
              if (settings.deductRentalCost) {
                base = Math.max(0, base - (event.rentalCost || 0) - extraRentalCost);
              }
              commissionValue += base * (settings.rentalPercentage / 100);
              rentalBaseValue += base;
            }
            if (settings.productEnabled) {
              let base = settings.productBase === 'GROSS' ? (event.productsGross || 0) : (event.productsRevenue || 0);
              if (settings.deductProductCost) {
                base = Math.max(0, base - (event.productsCost || 0) - extraProductCost);
              }
              commissionValue += base * (settings.productPercentage / 100);
              rentalBaseValue += base; // We use rentalBaseValue field in report to show the sum of bases
            }
            if (settings.taxEnabled) {
              let base = (event.tax || 0);
              if (settings.deductTaxCost) {
                base = Math.max(0, base - extraTaxCost);
              }
              commissionValue += base * (settings.taxPercentage / 100);
              rentalBaseValue += base;
            }
          } else {
            // Legacy
            const useTotalForCommission = companyData?.commissionBasis === 'TOTAL_PRICE';
            rentalBaseValue = useTotalForCommission ? event.total : (event.rentalRevenue || 0);
            commissionValue = rentalBaseValue * ((user.commissionPercentage || 0) / 100);
          }

          // Check if there's an expense that corresponds to this commission
          // We look for a specific marker in the description or a boat link if applicable
          // For now, let's use the description convention: "Comissão: [UserName] - [EventDate] - [ClientName]"
          // or we could use eventId if we added it to expense, but let's stick to description for now
          // as it's more human-readable in the cash book.
          const commissionExpense = allExpenses.find(exp =>
            !exp.isArchived &&
            exp.description.includes(`Comissão:`) &&
            exp.description.includes(event.id)
          );

          report.push({
            userId: user.id,
            userName: user.name,
            eventId: event.id,
            eventDate: event.date,
            eventTotalPrice: event.total,
            rentalRevenue: rentalBaseValue,
            commissionPercentage: user.commissionSettings ? 0 : (user.commissionPercentage || 0), // Show 0 if using advanced settings in this legacy field
            commissionValue,
            clientName: event.client.name,
            status: commissionExpense ? 'PAID' : 'PENDING',
            expenseId: commissionExpense?.id
          });
        }
      }
    }

    return report;
  }
}

export const commissionRepository = new CommissionRepository();
