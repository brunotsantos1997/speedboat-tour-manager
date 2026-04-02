# 📚 API Reference

## 🔥 **Firebase Configuration**

### **Configuração Inicial**
```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### **Coleções Firestore**

#### **profiles**
```typescript
// Coleção de usuários
interface ProfileDocument {
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PASSWORD_RESET_REQUESTED';
  role: 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'SELLER';
  commissionPercentage?: number;
  commissionSettings?: UserCommissionSettings;
  mustChangePassword?: boolean;
  secretQuestion?: string;
  secretAnswerHash?: string;
  calendarSettings?: {
    calendarId?: string;
    autoSync: boolean;
  };
  completedTours?: string[];
}
```

#### **events**
```typescript
// Coleção de eventos/passeios
interface EventDocument {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: EventStatus;
  paymentStatus?: PaymentStatus;
  boat: Boat;
  boardingLocation: BoardingLocation;
  tourType?: TourType;
  products: SelectedProduct[];
  client: ClientProfile;
  passengerCount: number;
  subtotal: number;
  total: number;
  tax?: number;
  observations?: string;
  createdByUserId?: string;
  // ... outros campos
}
```

#### **boats**
```typescript
interface BoatDocument {
  name: string;
  capacity: number;
  size: number; // pés
  pricePerHour: number;
  costPerHour?: number;
  pricePerHalfHour: number;
  costPerHalfHour?: number;
  organizationTimeMinutes: number;
  isArchived?: boolean;
}
```

#### **products**
```typescript
interface ProductDocument {
  name: string;
  price?: number;
  cost?: number;
  hourlyPrice?: number;
  hourlyCost?: number;
  pricingType: 'FIXED' | 'PER_PERSON' | 'HOURLY';
  iconKey: string;
  isDefaultCourtesy: boolean;
  isArchived?: boolean;
}
```

#### **clients**
```typescript
interface ClientDocument {
  phone: string;
  name: string;
  totalTrips: number;
  lastEventDate?: string;
  totalSpent?: number;
}
```

#### **payments**
```typescript
interface PaymentDocument {
  eventId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  date: string; // YYYY-MM-DD
  timestamp: number;
}
```

#### **expenses**
```typescript
interface ExpenseDocument {
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  categoryId: string;
  categoryName?: string;
  boatId?: string;
  boatName?: string;
  eventId?: string;
  status: 'PENDING' | 'PAID';
  paymentMethod?: PaymentMethod;
  timestamp: number;
  isArchived?: boolean;
}
```

#### **expenseCategories**
```typescript
interface ExpenseCategoryDocument {
  name: string;
  isArchived?: boolean;
}
```

#### **boardingLocations**
```typescript
interface BoardingLocationDocument {
  name: string;
  mapLink?: string;
  isArchived?: boolean;
}
```

#### **tourTypes**
```typescript
interface TourTypeDocument {
  name: string;
  color: string;
  isArchived?: boolean;
}
```

#### **companyData**
```typescript
interface CompanyDataDocument {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  website?: string;
  logo?: string;
}
```

#### **voucherTerms**
```typescript
interface VoucherTermsDocument {
  content: string;
  lastUpdated: number;
}
```

#### **voucherAppearance**
```typescript
interface VoucherAppearanceDocument {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logo?: string;
  backgroundImage?: string;
}
```

#### **auditLog**
```typescript
interface AuditLogDocument {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: number;
  details?: any;
}
```

---

## 🔐 **Autenticação API**

### **Funções de Autenticação**
```typescript
// Login
export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Registro
export const signUp = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Logout
export const signOut = async () => {
  return await signOut(auth);
};

// Reset de senha
export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(auth, email);
};

// Google OAuth
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};
```

---

## 📊 **Repository Patterns**

### **Base Repository**
```typescript
export abstract class BaseRepository<T> {
  protected collection: string;
  
  constructor(collection: string) {
    this.collection = collection;
  }
  
  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = doc(collection(db, this.collection));
    await setDoc(docRef, { ...data, id: docRef.id });
    return docRef.id;
  }
  
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
  }
  
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, data);
  }
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
  
  async getAll(): Promise<T[]> {
    const q = query(collection(db, this.collection));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  }
}
```

### **Event Repository**
```typescript
export class EventRepository extends BaseRepository<EventType> {
  constructor() {
    super('events');
  }
  
  async getByDateRange(startDate: string, endDate: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collection),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventType);
  }
  
  async getByStatus(status: EventStatus): Promise<EventType[]> {
    const q = query(
      collection(db, this.collection),
      where('status', '==', status),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventType);
  }
  
  async getByUser(userId: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collection),
      where('createdByUserId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventType);
  }
}
```

---

## 🎯 **Query Patterns**

### **Queries Comuns**
```typescript
// Buscar eventos do dia
const getTodayEvents = async () => {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'events'),
    where('date', '==', today),
    orderBy('startTime', 'asc')
  );
  return await getDocs(q);
};

// Buscar eventos de um cliente
const getClientEvents = async (clientId: string) => {
  const q = query(
    collection(db, 'events'),
    where('client.id', '==', clientId),
    orderBy('date', 'desc')
  );
  return await getDocs(q);
};

// Buscar despesas do mês
const getMonthlyExpenses = async (year: number, month: number) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  const q = query(
    collection(db, 'expenses'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  return await getDocs(q);
};
```

---

## 🔄 **Real-time Updates**

### **Listeners em Tempo Real**
```typescript
// Listener para eventos em tempo real
export const subscribeToEvents = (
  callback: (events: EventType[]) => void
) => {
  const q = query(collection(db, 'events'));
  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(doc => doc.data() as EventType);
    callback(events);
  });
};

// Listener para perfil de usuário
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: User | null) => void
) => {
  const docRef = doc(db, 'profiles', userId);
  return onSnapshot(docRef, (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() as User : null);
  });
};
```

---

## 📱 **Storage API**

### **Upload de Arquivos**
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const uploadLogo = async (file: File): Promise<string> => {
  return await uploadFile(file, `logos/${Date.now()}_${file.name}`);
};

export const uploadVoucherBackground = async (file: File): Promise<string> => {
  return await uploadFile(file, `voucher-backgrounds/${Date.now()}_${file.name}`);
};
```

---

## 🔍 **Search e Filters**

### **Busca Avançada**
```typescript
// Busca de clientes por nome ou telefone
export const searchClients = async (searchTerm: string): Promise<ClientProfile[]> => {
  const clientsRef = collection(db, 'clients');
  
  // Busca por nome
  const nameQuery = query(
    clientsRef,
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff')
  );
  
  // Busca por telefone
  const phoneQuery = query(
    clientsRef,
    where('phone', '>=', searchTerm),
    where('phone', '<=', searchTerm + '\uf8ff')
  );
  
  const [nameSnapshot, phoneSnapshot] = await Promise.all([
    getDocs(nameQuery),
    getDocs(phoneQuery)
  ]);
  
  // Combinar resultados e remover duplicatas
  const allResults = [
    ...nameSnapshot.docs.map(doc => doc.data() as ClientProfile),
    ...phoneSnapshot.docs.map(doc => doc.data() as ClientProfile)
  ];
  
  return Array.from(new Map(allResults.map(client => [client.id, client])).values());
};
```

---

## 📊 **Analytics e Relatórios**

### **Queries Analíticas**
```typescript
// Relatório financeiro mensal
export const getMonthlyFinancialReport = async (
  year: number,
  month: number
): Promise<FinancialReport> => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  
  // Buscar eventos do período
  const eventsQuery = query(
    collection(db, 'events'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    where('status', 'in', ['COMPLETED', 'ARCHIVED_COMPLETED'])
  );
  
  // Buscar despesas do período
  const expensesQuery = query(
    collection(db, 'expenses'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  
  const [eventsSnapshot, expensesSnapshot] = await Promise.all([
    getDocs(eventsQuery),
    getDocs(expensesQuery)
  ]);
  
  const events = eventsSnapshot.docs.map(doc => doc.data() as EventType);
  const expenses = expensesSnapshot.docs.map(doc => doc.data() as Expense);
  
  // Calcular totais
  const totalRevenue = events.reduce((sum, event) => sum + event.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = totalRevenue - totalExpenses;
  
  return {
    period: { year, month },
    totalRevenue,
    totalExpenses,
    profit,
    eventCount: events.length,
    expenseCount: expenses.length
  };
};
```

---

## 🛡️ **Security Rules**

### **Regras de Segurança Firestore**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Funções auxiliares
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data;
    }
    
    function isApproved() {
      return isAuthenticated() && getUserData().status == 'APPROVED';
    }
    
    function hasStaffPermission(allowAdmin) {
      return isApproved() && (
        getUserData().role == 'OWNER' ||
        getUserData().role == 'SUPER_ADMIN' ||
        (allowAdmin && getUserData().role == 'ADMIN')
      );
    }
    
    // Regras por coleção
    match /profiles/{userId} {
      allow read: if (isAuthenticated() && request.auth.uid == userId) || hasStaffPermission(true);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isApproved() && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['role', 'status', 'commissionPercentage', 'email'])) ||
        hasStaffPermission(true)
      );
    }
    
    match /events/{eventId} {
      allow read: if isApproved();
      allow create: if isApproved();
      allow update: if isApproved();
      allow delete: if hasStaffPermission(true);
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚀 **Performance Optimization**

### **Queries Otimizadas**
```typescript
// Paginação para grandes conjuntos de dados
export const getEventsPaginated = async (
  pageSize: number,
  lastDocument?: DocumentSnapshot
): Promise<{ events: EventType[], lastDoc: DocumentSnapshot }> => {
  let q = query(
    collection(db, 'events'),
    orderBy('date', 'desc'),
    limit(pageSize)
  );
  
  if (lastDocument) {
    q = query(q, startAfter(lastDocument));
  }
  
  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs.map(doc => doc.data() as EventType);
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
  
  return { events, lastDoc };
};

// Cache com IndexedDB
export const getCachedData = async (key: string): Promise<any> => {
  const cached = localStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutos
    if (!isExpired) return data;
  }
  return null;
};

export const setCachedData = async (key: string, data: any): Promise<void> => {
  const cacheData = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(cacheData));
};
```

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0
