// src/core/repositories/CommissionRepository.ts
import type { CommissionReportEntry } from '../domain/types';
import { eventRepository } from './EventRepository';
import { MockUserRepository } from '../infra/repositories/MockUserRepository';
import type { User } from '../domain/User';

// Get the singleton instance of the user repository
const userRepository = MockUserRepository.getInstance();

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
    const allUsers = await userRepository.findAll();

    const userMap = new Map<string, User>(allUsers.map(user => [user.id, user]));

    const filteredEvents = allEvents.filter(event => {
      if (event.status !== 'COMPLETED') {
        return false;
      }
      const eventDate = new Date(event.date + 'T00:00:00'); // Ensure local timezone
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
