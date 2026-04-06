// tests/global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global test state here
  // For example: clear test database, clean temporary files, etc.
  
  console.log('✅ Test environment cleaned up');
}

export default globalTeardown;
