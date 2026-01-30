// src/core/repositories/index.ts
/**
 * Repositories are now managed by the AuthContext lifecycle.
 * They use Firebase's native persistence and real-time listeners (onSnapshot).
 */
export const initializeOfflineRepositories = async () => {
  // Initialization is handled by initializeRepositories() in AuthContext.tsx
};
