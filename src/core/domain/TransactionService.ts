// src/core/domain/TransactionService.ts
import type { EventType, Payment } from './types';
import { eventRepository } from '../repositories/EventRepository';
import { paymentRepository } from '../repositories/PaymentRepository';
import { logger } from '../common/Logger';
import { auditLogRepository } from '../repositories/AuditLogRepository';

export interface TransactionResult {
  success: boolean;
  eventId?: string;
  paymentId?: string;
  expenseIds?: string[];
  error?: string;
  rollbackData?: {
    originalEvent?: EventType;
    createdPaymentIds?: string[];
    createdExpenseIds?: string[];
  };
}

export class TransactionService {
  /**
   * Atomic transaction: Event + Payment + Status Update
   */
  static async createEventWithPayment(
    eventData: Omit<EventType, 'id'>,
    paymentData: Omit<Payment, 'id'>,
    userId: string,
    userName: string
  ): Promise<TransactionResult> {
    const rollbackData: TransactionResult['rollbackData'] = {
      createdPaymentIds: [],
      createdExpenseIds: []
    };

    try {
      logger.info('Starting atomic transaction: create event with payment', {
        userId,
        eventTotal: eventData.total,
        paymentAmount: paymentData.amount
      });

      // Step 1: Create event
      const savedEvent = await eventRepository.add(eventData);
      
      // Step 2: Create payment with event reference
      const paymentWithEventRef = {
        ...paymentData,
        eventId: savedEvent.id
      };
      const savedPayment = await paymentRepository.add(paymentWithEventRef);
      rollbackData.createdPaymentIds = [savedPayment.id];

      // Step 3: Update event status based on payment
      const totalPaid = paymentData.amount;
      const updatedEvent = {
        ...savedEvent,
        status: totalPaid > 0 ? 'SCHEDULED' as const : 'PRE_SCHEDULED' as const,
        paymentStatus: totalPaid >= savedEvent.total ? 'CONFIRMED' as const : 'PENDING' as const
      };

      const finalEvent = await eventRepository.updateEvent(updatedEvent);

      // Step 4: Audit log
      await auditLogRepository.log({
        userId,
        userName,
        targetId: finalEvent.id,
        action: 'CREATE_EVENT_WITH_PAYMENT',
        resource: 'event',
        context: {
          eventTotal: finalEvent.total,
          paymentAmount: paymentData.amount,
          paymentMethod: paymentData.method,
          finalStatus: finalEvent.status
        }
      });

      logger.info('Atomic transaction completed successfully', {
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      });

      return {
        success: true,
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      };

    } catch (error) {
      logger.error('Atomic transaction failed, attempting rollback', error as Error, {
        userId,
        rollbackData
      });

      await this.performRollback(rollbackData);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic transaction: Confirm Payment + Update Event Status
   */
  static async confirmPaymentAndUpdateStatus(
    eventId: string,
    paymentData: Omit<Payment, 'id'>,
    userId: string,
    userName: string
  ): Promise<TransactionResult> {
    try {
      logger.info('Starting atomic transaction: confirm payment', {
        eventId,
        paymentAmount: paymentData.amount
      });

      // Get current event
      const event = await eventRepository.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Step 1: Add payment
      const savedPayment = await paymentRepository.add(paymentData);

      // Step 2: Get all payments for this event
      const allPayments = await paymentRepository.getByEventId(eventId);
      const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

      // Step 3: Update event status
      const updatedEvent = {
        ...event,
        status: totalPaid > 0 && event.status === 'PRE_SCHEDULED' ? 'SCHEDULED' as const : event.status,
        paymentStatus: totalPaid >= event.total ? 'CONFIRMED' as const : 'PENDING' as const
      };

      const finalEvent = await eventRepository.updateEvent(updatedEvent);

      // Step 4: Audit log
      await auditLogRepository.log({
        userId,
        userName,
        targetId: eventId,
        action: 'CONFIRM_PAYMENT',
        resource: 'payment',
        context: {
          paymentId: savedPayment.id,
          paymentAmount: paymentData.amount,
          totalPaid,
          eventTotal: event.total,
          newStatus: finalEvent.status,
          paymentStatus: finalEvent.paymentStatus
        }
      });

      logger.info('Payment confirmation transaction completed', {
        eventId,
        paymentId: savedPayment.id,
        totalPaid,
        newStatus: finalEvent.status
      });

      return {
        success: true,
        eventId: finalEvent.id,
        paymentId: savedPayment.id
      };

    } catch (error) {
      logger.error('Payment confirmation transaction failed', error as Error, {
        eventId,
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic transaction: Cancel Event + Handle Payments
   */
  static async cancelEventWithRefunds(
    eventId: string,
    cancelReason: string,
    userId: string,
    userName: string
  ): Promise<TransactionResult> {
    const rollbackData: TransactionResult['rollbackData'] = {};

    try {
      logger.info('Starting atomic transaction: cancel event', {
        eventId,
        cancelReason
      });

      // Get current event
      const event = await eventRepository.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      rollbackData.originalEvent = event;

      // Step 1: Get all payments for this event
      const payments = await paymentRepository.getByEventId(eventId);

      // Step 2: Update event status
      const cancelledEvent = {
        ...event,
        status: 'CANCELLED' as const,
        cancelReason,
        cancelledAt: Date.now()
      };

      const finalEvent = await eventRepository.updateEvent(cancelledEvent);

      // Step 3: Handle refunds if needed (simplified - would integrate with payment gateway)
      const refundablePayments = payments.filter(p => p.status === 'CONFIRMED');
      
      // Step 4: Audit log
      await auditLogRepository.log({
        userId,
        userName,
        targetId: eventId,
        action: 'CANCEL_EVENT',
        resource: 'event',
        context: {
          cancelReason,
          paymentsCount: payments.length,
          refundableCount: refundablePayments.length,
          previousStatus: event.status
        }
      });

      logger.info('Event cancellation transaction completed', {
        eventId,
        paymentsCount: payments.length,
        refundableCount: refundablePayments.length
      });

      return {
        success: true,
        eventId: finalEvent.id
      };

    } catch (error) {
      logger.error('Event cancellation transaction failed', error as Error, {
        eventId,
        userId
      });

      // Attempt to restore original event status
      if (rollbackData.originalEvent) {
        try {
          await eventRepository.updateEvent(rollbackData.originalEvent);
          logger.info('Rollback successful - original event restored', {
            eventId
          });
        } catch (rollbackError) {
          logger.error('Rollback failed - manual intervention required', rollbackError as Error, {
            eventId
          });
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async performRollback(rollbackData: NonNullable<TransactionResult['rollbackData']>) {
    logger.warn('Performing transaction rollback', rollbackData);

    // Rollback created payments
    if (rollbackData.createdPaymentIds) {
      for (const paymentId of rollbackData.createdPaymentIds) {
        try {
          await paymentRepository.remove(paymentId);
          logger.debug(`Rolled back payment: ${paymentId}`);
        } catch (error) {
          logger.error(`Failed to rollback payment: ${paymentId}`, error as Error);
        }
      }
    }
  }

  /**
   * Validate transaction prerequisites
   */
  static validateTransactionPrerequisites(eventData: Omit<EventType, 'id'>): string[] {
    const errors: string[] = [];

    if (!eventData.boat?.id) {
      errors.push('Boat is required');
    }

    if (!eventData.client?.id) {
      errors.push('Client is required');
    }

    if (!eventData.boardingLocation?.id) {
      errors.push('Boarding location is required');
    }

    if (eventData.total <= 0) {
      errors.push('Event total must be greater than 0');
    }

    if (eventData.passengerCount <= 0) {
      errors.push('Passenger count must be greater than 0');
    }

    return errors;
  }
}
