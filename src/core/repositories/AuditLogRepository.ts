// src/core/repositories/AuditLogRepository.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AuditLog } from '../domain/types';

class AuditLogRepository {
  private static instance: AuditLogRepository;
  private collectionName = 'audit_logs';

  private constructor() {}

  public static getInstance(): AuditLogRepository {
    if (!AuditLogRepository.instance) {
      AuditLogRepository.instance = new AuditLogRepository();
    }
    return AuditLogRepository.instance;
  }

  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...entry,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
