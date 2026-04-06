import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePasswordResetViewModel } from '../../../src/viewmodels/usePasswordResetViewModel';

const mockRequestPasswordReset = vi.fn();

vi.mock('../../../src/core/services/auth/PasswordResetService', () => ({
  PasswordResetService: {
    requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
  },
}));

describe('usePasswordResetViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestPasswordReset.mockResolvedValue(undefined);
  });

  it('delegates password reset requests to the auth service', async () => {
    const { result } = renderHook(() => usePasswordResetViewModel());

    await act(async () => {
      await result.current.requestPasswordReset('cliente@example.com');
    });

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('cliente@example.com');
  });
});
