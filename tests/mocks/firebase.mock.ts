import { vi } from 'vitest'

type MockRecord = Record<string, unknown>
type SubscriberCallback = (snapshot: unknown) => void
type TransactionHandler = (transaction: MockRecord) => Promise<unknown> | unknown


// Mock base para Firestore - versÃ£o simplificada
export const createMockFirestore = () => {
  const collections = new Map<string, any[]>()
  const subscribers = new Map<string, Set<SubscriberCallback>>()

  return {
    collection: vi.fn((path: string) => createMockCollectionReference(path, collections, subscribers)),
    doc: vi.fn((path: string) => createMockDocumentReference(path, collections, subscribers)),
    runTransaction: vi.fn((updateFunction: TransactionHandler) => {
      const mockTransaction = createMockTransaction()
      return updateFunction(mockTransaction)
    }),
    batch: vi.fn(() => createMockWriteBatch()),
    settings: vi.fn(),
    clearIndexedDbPersistence: vi.fn(),
    enableIndexedDbPersistence: vi.fn(),
    enableMultiTabIndexedDbPersistence: vi.fn(),
    disableNetwork: vi.fn(),
    enableNetwork: vi.fn(),
    waitForPendingWrites: vi.fn(),
    terminate: vi.fn()
  }
}

// Mock para CollectionReference
export const createMockCollectionReference = (
  path: string, 
  collections: Map<string, any[]>,
  subscribers: Map<string, Set<SubscriberCallback>>
) => {
  const collectionData = collections.get(path) || []
  
  return {
    path,
    id: path.split('/').pop() || '',
    parent: null,
    type: 'collection',
    firestore: createMockFirestore(),
    doc: vi.fn((id: string) => createMockDocumentReference(`${path}/${id}`, collections, subscribers)),
    add: vi.fn(async (data: any) => {
      const newDoc = { ...data, id: `doc-${Date.now()}-${Math.random()}` }
      collectionData.push(newDoc)
      collections.set(path, collectionData)
      return createMockDocumentReference(`${path}/${newDoc.id}`, collections, subscribers)
    }),
    where: vi.fn((field: string, op: string, value: any) => createMockQuery(path, collections, subscribers)),
    orderBy: vi.fn((field: string, direction?: string) => createMockQuery(path, collections, subscribers)),
    limit: vi.fn((limit: number) => createMockQuery(path, collections, subscribers)),
    get: vi.fn(async () => createMockQuerySnapshot(collectionData)),
    onSnapshot: vi.fn((callback: (snapshot: any) => void) => {
      const subs = subscribers.get(path) || new Set()
      subs.add(callback)
      subscribers.set(path, subs)
      
      // Simular notificaÃ§Ã£o inicial
      callback(createMockQuerySnapshot(collectionData))
      
      return vi.fn(() => {
        subs.delete(callback)
      })
    })
  }
}

// Mock para DocumentReference
export const createMockDocumentReference = (
  path: string,
  collections: Map<string, any[]>,
  subscribers: Map<string, Set<SubscriberCallback>>
) => {
  const pathParts = path.split('/')
  const id = pathParts[pathParts.length - 1]
  const collectionPath = pathParts.slice(0, -1).join('/')
  
  const collectionData = collections.get(collectionPath) || []
  const documentData = collectionData.find(doc => doc.id === id)

  return {
    path,
    id,
    parent: collectionPath ? createMockCollectionReference(collectionPath, collections, subscribers) : null,
    type: 'document',
    firestore: createMockFirestore(),
    collection: vi.fn(() => createMockCollectionReference(path, collections, subscribers)),
    get: vi.fn(async () => ({
      exists: !!documentData,
      data: () => documentData || null,
      id,
      metadata: { hasPendingWrites: false, fromCache: false, isEqual: () => true },
      ref: createMockDocumentReference(path, collections, subscribers)
    })),
    set: vi.fn(async (data: any, options?: any) => {
      const existingIndex = collectionData.findIndex(doc => doc.id === id)
      const newDoc = { ...data, id }
      
      if (existingIndex >= 0) {
        if (options?.merge) {
          collectionData[existingIndex] = { ...collectionData[existingIndex], ...newDoc }
        } else {
          collectionData[existingIndex] = newDoc
        }
      } else {
        collectionData.push(newDoc)
      }
      
      collections.set(collectionPath, collectionData)
      notifySubscribers(collectionPath, collectionData, subscribers)
    }),
    update: vi.fn(async (data: any) => {
      const existingIndex = collectionData.findIndex(doc => doc.id === id)
      if (existingIndex >= 0) {
        collectionData[existingIndex] = { ...collectionData[existingIndex], ...data }
        collections.set(collectionPath, collectionData)
        notifySubscribers(collectionPath, collectionData, subscribers)
      }
    }),
    delete: vi.fn(async () => {
      const existingIndex = collectionData.findIndex(doc => doc.id === id)
      if (existingIndex >= 0) {
        collectionData.splice(existingIndex, 1)
        collections.set(collectionPath, collectionData)
        notifySubscribers(collectionPath, collectionData, subscribers)
      }
    }),
    onSnapshot: vi.fn((callback: (snapshot: any) => void) => {
      const subs = subscribers.get(path) || new Set()
      subs.add(callback)
      subscribers.set(path, subs)
      
      // Simular notificaÃ§Ã£o inicial
      callback({
        exists: !!documentData,
        data: () => documentData || null,
        id,
        metadata: { hasPendingWrites: false, fromCache: false, isEqual: () => true },
        ref: createMockDocumentReference(path, collections, subscribers)
      })
      
      return vi.fn(() => {
        subs.delete(callback)
      })
    })
  }
}

// Mock para Query
export const createMockQuery = (
  path: string,
  collections: Map<string, any[]>,
  subscribers: Map<string, Set<SubscriberCallback>>
) => {
  const collectionData = collections.get(path) || []
  
  return {
    type: 'query',
    firestore: createMockFirestore(),
    where: vi.fn((field: string, op: string, value: any) => createMockQuery(path, collections, subscribers)),
    orderBy: vi.fn((field: string, direction?: string) => createMockQuery(path, collections, subscribers)),
    limit: vi.fn((limit: number) => createMockQuery(path, collections, subscribers)),
    get: vi.fn(async () => createMockQuerySnapshot(collectionData)),
    onSnapshot: vi.fn((callback: (snapshot: any) => void) => {
      const subs = subscribers.get(path) || new Set()
      subs.add(callback)
      subscribers.set(path, subs)
      
      callback(createMockQuerySnapshot(collectionData))
      
      return vi.fn(() => {
        subs.delete(callback)
      })
    })
  }
}

// Mock para QuerySnapshot
export const createMockQuerySnapshot = (docs: any[]) => ({
  docs: docs.map(doc => ({
    id: doc.id,
    data: () => doc,
    metadata: { hasPendingWrites: false, fromCache: false },
    exists: true,
    ref: { id: doc.id },
    get: () => ({ data: () => doc }),
    toJSON: () => doc
  })),
  size: docs.length,
  empty: docs.length === 0,
  metadata: { hasPendingWrites: false, fromCache: false, isEqual: () => true },
  docChanges: () => [],
  forEach: (callback: (doc: any) => void) => docs.forEach(doc => callback({ 
    id: doc.id, 
    data: () => doc,
    metadata: { hasPendingWrites: false, fromCache: false },
    exists: true,
    ref: { id: doc.id },
    get: () => ({ data: () => doc }),
    toJSON: () => doc
  })),
  query: createMockQuery('', new Map(), new Map())
})

// Mock para Transaction
export const createMockTransaction = () => ({
  get: vi.fn(async (docRef: any) => ({
    exists: false,
    data: () => null,
    id: docRef.id,
    metadata: { hasPendingWrites: false, fromCache: false },
    ref: docRef
  })),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
})

// Mock para WriteBatch
export const createMockWriteBatch = () => ({
  set: vi.fn(() => createMockWriteBatch()),
  update: vi.fn(() => createMockWriteBatch()),
  delete: vi.fn(() => createMockWriteBatch()),
  commit: vi.fn(async () => void 0)
})

// Mock para Timestamp
export const createMockTimestamp = (seconds: number, nanoseconds: number = 0) => ({
  seconds,
  nanoseconds,
  type: 'timestamp',
  toDate: () => new Date(seconds * 1000 + nanoseconds / 1000000),
  toMillis: () => seconds * 1000 + nanoseconds / 1000000,
  isEqual: vi.fn((other: any) => other.seconds === seconds && other.nanoseconds === nanoseconds),
  toJSON: () => ({ seconds, nanoseconds, type: 'timestamp' }),
  toString: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
  valueOf: () => seconds * 1000 + nanoseconds / 1000000
})

// Mock para FieldValue
export const createMockFieldValue = {
  serverTimestamp: () => ({ __type: 'FieldValue', value: 'serverTimestamp' }),
  delete: () => ({ __type: 'FieldValue', value: 'delete' }),
  arrayUnion: (...elements: any[]) => ({ __type: 'FieldValue', value: 'arrayUnion', elements }),
  arrayRemove: (...elements: any[]) => ({ __type: 'FieldValue', value: 'arrayRemove', elements }),
  increment: (n: number) => ({ __type: 'FieldValue', value: 'increment', n })
}

// Mock para GeoPoint
export const createMockGeoPoint = (latitude: number, longitude: number) => ({
  latitude,
  longitude,
  isEqual: vi.fn((other: any) => other.latitude === latitude && other.longitude === longitude),
  toJSON: () => ({ latitude, longitude }),
  toString: () => `GeoPoint(latitude=${latitude}, longitude=${longitude})`
})

// Helper function para notificar subscribers
const notifySubscribers = (
  collectionPath: string,
  collectionData: any[],
  subscribers: Map<string, Set<SubscriberCallback>>
) => {
  const subs = subscribers.get(collectionPath)
  if (subs) {
    subs.forEach(callback => {
      try {
        callback(createMockQuerySnapshot(collectionData))
      } catch (error) {
        console.error('Error in subscriber callback:', error)
      }
    })
  }
}

// Mock para Firebase Auth
export const createMockAuth = () => ({
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(async (email: string, password: string) => ({
    user: {
      uid: 'test-user-uid',
      email,
      displayName: 'Test User',
      emailVerified: true,
      getIdToken: vi.fn(async () => 'mock-token'),
      refreshToken: 'mock-refresh-token'
    }
  })),
  createUserWithEmailAndPassword: vi.fn(async (email: string, password: string) => ({
    user: {
      uid: 'new-user-uid',
      email,
      displayName: 'New User',
      emailVerified: false,
      getIdToken: vi.fn(async () => 'mock-new-token'),
      refreshToken: 'mock-new-refresh-token'
    }
  })),
  signOut: vi.fn(async () => void 0),
  sendPasswordResetEmail: vi.fn(async (email: string) => void 0),
  confirmPasswordReset: vi.fn(async (code: string, newPassword: string) => void 0),
  updatePassword: vi.fn(async (user: any, newPassword: string) => void 0),
  reauthenticateWithCredential: vi.fn(async (user: any, credential: any) => void 0),
  onAuthStateChanged: vi.fn((callback: (user: any) => void) => {
    // Simular usuÃ¡rio nÃ£o autenticado inicialmente
    callback(null)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  })
})

// Mock para Firebase Storage
export const createMockStorage = () => ({
  ref: vi.fn((path?: string) => ({
    path: path || '',
    name: path?.split('/').pop() || '',
    parent: null,
    root: null,
    bucket: 'test-bucket',
    fullPath: path || '',
    getDownloadURL: vi.fn(async () => 'https://mock-storage-url.com/file'),
    getMetadata: vi.fn(async () => ({
      name: 'mock-file',
      size: 1024,
      contentType: 'image/jpeg',
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      generation: '1',
      metadataGeneration: '1',
      bucket: 'test-bucket',
      md5Hash: 'mock-hash',
      crc32c: 'mock-crc32c',
      etag: 'mock-etag',
      downloadTokens: ['mock-token']
    })),
    put: vi.fn((data: any, metadata?: any) => ({
      snapshot: {
        ref: { path: path || '' },
        bytesTransferred: 1024,
        totalBytes: 1024,
        state: 'success',
        metadata: {
          name: 'mock-file',
          size: 1024,
          contentType: 'image/jpeg',
          timeCreated: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        task: {
          on: vi.fn(),
          then: vi.fn(),
          catch: vi.fn(),
          finally: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          cancel: vi.fn()
        }
      }
    })),
    putString: vi.fn((data: string, format?: string, metadata?: any) => ({
      ref: { path: path || '' },
      bytesTransferred: data.length,
      totalBytes: data.length,
      state: 'success',
      metadata: {
        name: 'mock-file',
        size: data.length,
        contentType: format || 'text/plain',
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    })),
    delete: vi.fn(async () => void 0),
    listAll: vi.fn(async () => ({
      prefixes: [],
      items: []
    })),
    child: vi.fn((childPath: string) => createMockStorage().ref(`${path}/${childPath}`))
  }))
})

// Exportar instÃ¢ncias globais para uso nos testes
export const mockFirestore = createMockFirestore()
export const mockAuth = createMockAuth()
export const mockStorage = createMockStorage()
export const mockTimestamp = createMockTimestamp
export const mockFieldValue = createMockFieldValue
export const mockGeoPoint = createMockGeoPoint

