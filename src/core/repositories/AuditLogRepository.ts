import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logger } from '../common/Logger';

export interface AuditLogEntry {
  userId: string;
  userName: string;
  targetId?: string;
  targetName?: string;
  action: string;
  resource?: string;
  collection?: string;
  docId?: string;
  newData?: any;
  oldData?: any;
  context?: Record<string, any>;
  timestamp: any;
}

export const auditLogRepository = {
  log: async (entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> => {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'auditLog'), auditEntry);
    } catch (error) {
      logger.error('Failed to write audit log', error as Error, { entry });
      // Continue execution - audit failure shouldn't break the main flow
    }
  }
};
