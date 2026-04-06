import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  return;
}

export default globalTeardown;
