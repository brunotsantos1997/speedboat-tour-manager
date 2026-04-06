import { beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  global.console = {
    ...console,
  }

  process.env.NODE_ENV = 'test'
  process.env.VITE_FIREBASE_TEST_PROJECT_ID = 'erp-speedboat-test'
  process.env.VITE_TEST_MOCK_FIRESTORE = 'true'
})

afterEach(() => {
  cleanup()
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
  }
  vi.clearAllMocks()
})
