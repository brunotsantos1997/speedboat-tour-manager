// src/core/repositories/VoucherTermsRepository.ts
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { VoucherTerms } from '../domain/types';

export class VoucherTermsRepository {
  private static instance: VoucherTermsRepository;
  private docId = 'default';
  private collectionName = 'voucher_terms';
  private data: VoucherTerms | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): VoucherTermsRepository {
    if (!VoucherTermsRepository.instance) {
      VoucherTermsRepository.instance = new VoucherTermsRepository();
    }
    return VoucherTermsRepository.instance;
  }

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const docRef = doc(db, this.collectionName, this.docId);
    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.data = { ...docSnap.data() as VoucherTerms, id: docSnap.id };
      }
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.data = null;
    this.currentUser = null;
  }

  async get(): Promise<VoucherTerms> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.data = { ...docSnap.data() as VoucherTerms, id: docSnap.id };
      return this.data;
    }
    return { id: this.docId, terms: 'Termos padrão...' };
  }

  async update(updatedData: VoucherTerms): Promise<VoucherTerms> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para alterar os termos do voucher.');
    }
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);

    await setDoc(docRef, data, { merge: true });

    this.data = updatedData;
    return updatedData;
  }
}
