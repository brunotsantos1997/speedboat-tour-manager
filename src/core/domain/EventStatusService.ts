// src/core/domain/EventStatusService.ts
import type { EventType, Payment } from './types';
import { logger } from '../common/Logger';

export class EventStatusService {
  /**
   * Centralized rule: Auto-cancel PRE_SCHEDULED events after 24 hours
   */
  static shouldAutoCancel(event: EventType): boolean {
    if (event.status !== 'PRE_SCHEDULED' || !event.preScheduledAt) {
      return false;
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const shouldCancel = now - event.preScheduledAt > twentyFourHours;

    if (shouldCancel) {
      logger.info(`Event ${event.id} should be auto-cancelled`, {
        eventId: event.id,
        preScheduledAt: event.preScheduledAt,
        hoursElapsed: (now - event.preScheduledAt) / (60 * 60 * 1000)
      });
    }

    return shouldCancel;
  }

  /**
   * Centralized rule: Update event status based on payment
   */
  static updateStatusFromPayment(
    event: EventType,
    totalPaid: number,
    payments: Payment[]
  ): EventType {
    let updatedEvent = { ...event };

    // Rule 1: PRE_SCHEDULED -> SCHEDULED on first payment
    if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
      updatedEvent.status = 'SCHEDULED';
      logger.info(`Event ${event.id} moved from PRE_SCHEDULED to SCHEDULED`, {
        eventId: event.id,
        totalPaid,
        paymentsCount: payments.length
      });
    }

    // Rule 2: Update payment status
    updatedEvent.paymentStatus = totalPaid >= updatedEvent.total ? 'CONFIRMED' : 'PENDING';

    return updatedEvent;
  }

  /**
   * Centralized rule: Archive completed/cancelled events
   */
  static archiveEvent(event: EventType): EventType {
    let archivedEvent: EventType;

    switch (event.status) {
      case 'COMPLETED':
        archivedEvent = { ...event, status: 'ARCHIVED_COMPLETED' as const };
        logger.info(`Event ${event.id} archived as completed`, { eventId: event.id });
        break;
      case 'CANCELLED':
        archivedEvent = { ...event, status: 'ARCHIVED_CANCELLED' as const };
        logger.info(`Event ${event.id} archived as cancelled`, { eventId: event.id });
        break;
      case 'PENDING_REFUND':
        archivedEvent = { ...event, status: 'REFUNDED' as const };
        logger.info(`Event ${event.id} marked as refunded`, { eventId: event.id });
        break;
      default:
        throw new Error(`Cannot archive event with status: ${event.status}`);
    }

    return archivedEvent;
  }

  /**
   * Centralized rule: Validate if event can be edited
   */
  static canEditEvent(event: EventType, userRole: string, userId: string): boolean {
    // Owners and admins can edit any event
    if (['OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return true;
    }

    // Regular users can only edit their own events
    if (event.createdByUserId === userId) {
      return true;
    }

    return false;
  }

  /**
   * Centralized rule: Get confirmed statuses for reporting
   */
  static getConfirmedStatuses(): readonly string[] {
    return ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'] as const;
  }

  /**
   * Centralized rule: Get active (non-cancelled) statuses
   */
  static getActiveStatuses(): readonly string[] {
    return ['PRE_SCHEDULED', 'SCHEDULED', 'COMPLETED'] as const;
  }
}
