// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up test environment...');
  
  // Setup any global test state here
  // For example: seed test database, clear caches, etc.
  
  console.log('✅ Test environment ready');
}

export default globalSetup;
