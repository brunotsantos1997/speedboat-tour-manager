// src/core/repositories/CommissionRepository.ts
import type { CommissionReportEntry } from '../domain/types';
import { eventRepository } from './EventRepository';
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

    const filteredEvents = allEvents.filter(event => {
      if (event.status !== 'COMPLETED') {
        return false;
      }
      const eventDate = new Date(event.date + 'T00:00:00');
      const isAfterStartDate = eventDate >= startDate;
      const isBeforeEndDate = eventDate <= endDate;
      const matchesUser = !userId || event.createdByUserId === userId;

      return isAfterStartDate && isBeforeEndDate && matchesUser;
    });

    const report: CommissionReportEntry[] = [];

    for (const event of filteredEvents) {
      if (event.createdByUserId) {
        const user = userMap.get(event.createdByUserId);
        if (user && user.commissionPercentage) {
          const commissionValue = event.total * (user.commissionPercentage / 100);
          report.push({
            userId: user.id,
            userName: user.name,
            eventId: event.id,
            eventDate: event.date,
            eventTotalPrice: event.total,
            commissionPercentage: user.commissionPercentage,
            commissionValue,
            clientName: event.client.name,
          });
        }
      }
    }

    return report;
  }
}

export const commissionRepository = new CommissionRepository();
