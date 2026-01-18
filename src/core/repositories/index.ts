// src/core/repositories/index.ts
import { eventRepository } from './EventRepository';

export const initializeMockRepositories = async () => {
  // Although getInstance ensures a single instance, ensureInitialized
  // is what populates the mock data. We call it here to make sure
  // all mock data is loaded before any part of the app tries to access it.
  await (eventRepository as any).constructor.ensureInitialized();
};
