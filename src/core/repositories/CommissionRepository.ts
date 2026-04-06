// src/core/repositories/CommissionRepository.ts
import type { CommissionReportEntry } from '../domain/types';
import { eventRepository } from './EventRepository';
import { expenseRepository } from './ExpenseRepository';
import { CompanyDataRepository } from './CompanyDataRepository';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { User } from '../domain/User';
import { format } from 'date-fns';

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
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    
    // Fetch only events in the period
    const filteredEvents = await eventRepository.getEventsByDateRange(startStr, endStr);

    // Fetch all users/profiles (Profiles collection is usually small, so getDocs is okay)
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const allUsers = profilesSnap.docs.map(doc => ({ ...doc.data() as User, id: doc.id }));

    const userMap = new Map<string, User>(allUsers.map(user => [user.id, user]));

    // Fetch expenses for the period to check for commission payments
    const expensesInPeriod = await expenseRepository.getByDateRange(startStr, endStr);

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];

    const validEvents = filteredEvents.filter(event => {
      if (!confirmedStatuses.includes(event.status)) {
        return false;
      }
      return !userId || event.createdByUserId === userId;
    });

    const report: CommissionReportEntry[] = [];
    const companyData = await CompanyDataRepository.getInstance().get();

    for (const event of validEvents) {
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
                base = Math.max(0, base - (event.productsCost || 0));
              }
              commissionValue += base * (settings.productPercentage / 100);
              rentalBaseValue += base;
            }
            if (settings.taxEnabled) {
              let base = (event.tax || 0);
              commissionValue += base * (settings.taxPercentage / 100);
              rentalBaseValue += base;
            }
          } else {
            // Legacy
            const useTotalForCommission = companyData?.commissionBasis === 'TOTAL_PRICE';
            rentalBaseValue = useTotalForCommission ? event.total : (event.rentalRevenue || 0);
            commissionValue = rentalBaseValue * ((user.commissionPercentage || 0) / 100);
          }

          const commissionExpense = expensesInPeriod.find(exp =>
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
            commissionPercentage: user.commissionSettings ? 0 : (user.commissionPercentage || 0),
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
