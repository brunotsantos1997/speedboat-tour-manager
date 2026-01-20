// src/core/repositories/index.ts
import { eventRepository } from './EventRepository';

export const initializeMockRepositories = async () => {
  // The repository constructor triggers an async load. We await its internal
  // promise to ensure mock data is loaded before the app uses it.
  await (eventRepository as any).initializationPromise;

  // Set a global flag for test automation environments like Playwright
  if (typeof window !== 'undefined') {
    (window as any).MOCK_DATA_INITIALIZED = true;
  }
};
