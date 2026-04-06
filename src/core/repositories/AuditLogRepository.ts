import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
      console.error('Failed to write audit log:', error);
      // Continue execution - audit failure shouldn't break the main flow
    }
  }
};
