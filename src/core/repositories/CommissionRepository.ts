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
    const useTotalForCommission = companyData?.commissionBasis === 'TOTAL_PRICE';

    for (const event of filteredEvents) {
      if (event.createdByUserId) {
        const user = userMap.get(event.createdByUserId);
        if (user && user.commissionPercentage) {
          // Commission calculation base depends on company configuration
          const baseValue = useTotalForCommission ? event.total : (event.rentalRevenue || 0);
          const commissionValue = baseValue * (user.commissionPercentage / 100);

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
            rentalRevenue: baseValue,
            commissionPercentage: user.commissionPercentage,
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
