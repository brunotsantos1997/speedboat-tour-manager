import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../src/core/domain/User';
import { useProfileViewModel } from '../../../src/viewmodels/useProfileViewModel';

const mockUpdateProfile = vi.fn();
const mockUpdateCalendarSettings = vi.fn();
const mockUpdateCompletedTours = vi.fn();
const mockResetTours = vi.fn();

vi.mock('../../../src/core/services/auth/ProfileService', () => ({
  ProfileService: {
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    updateCalendarSettings: (...args: unknown[]) => mockUpdateCalendarSettings(...args),
    updateCompletedTours: (...args: unknown[]) => mockUpdateCompletedTours(...args),
    resetTours: (...args: unknown[]) => mockResetTours(...args),
  },
}));

const currentUser: User = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  status: 'APPROVED',
  role: 'SELLER',
  completedTours: ['tour-1'],
};

describe('useProfileViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({});
    mockUpdateCalendarSettings.mockResolvedValue({});
    mockUpdateCompletedTours.mockResolvedValue({ completedTours: ['tour-1', 'tour-2'] });
    mockResetTours.mockResolvedValue({ completedTours: [] });
  });

  it('propagates self profile updates back to the session state', async () => {
    mockUpdateProfile.mockResolvedValue({ name: 'Ana Paula' });
    const onUserUpdated = vi.fn();
    const { result } = renderHook(() => useProfileViewModel());

    await act(async () => {
      await result.current.updateProfile(
        currentUser,
        currentUser.id,
        { name: 'Ana Paula' },
        onUserUpdated
      );
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith(currentUser, currentUser.id, { name: 'Ana Paula' });
    expect(onUserUpdated).toHaveBeenCalledWith({ name: 'Ana Paula' });
  });

  it('does not mutate local session state when editing another profile', async () => {
    mockUpdateProfile.mockResolvedValue({ name: 'Outro Nome' });
    const onUserUpdated = vi.fn();
    const adminUser: User = { ...currentUser, id: 'admin-1', role: 'OWNER' };
    const { result } = renderHook(() => useProfileViewModel());

    await act(async () => {
      await result.current.updateProfile(adminUser, 'user-2', { name: 'Outro Nome' }, onUserUpdated);
    });

    expect(onUserUpdated).not.toHaveBeenCalled();
  });

  it('updates calendar settings for the current user', async () => {
    mockUpdateCalendarSettings.mockResolvedValue({
      calendarSettings: { calendarId: 'calendar-123', autoSync: true },
    });
    const onUserUpdated = vi.fn();
    const { result } = renderHook(() => useProfileViewModel());

    await act(async () => {
      await result.current.updateCalendarSettings(
        currentUser,
        currentUser.id,
        { calendarId: 'calendar-123', autoSync: true },
        onUserUpdated
      );
    });

    expect(onUserUpdated).toHaveBeenCalledWith({
      calendarSettings: { calendarId: 'calendar-123', autoSync: true },
    });
  });

  it('updates completed tours through the service layer', async () => {
    const onUserUpdated = vi.fn();
    const { result } = renderHook(() => useProfileViewModel());

    await act(async () => {
      await result.current.updateCompletedTours(currentUser, 'tour-2', onUserUpdated);
    });

    expect(mockUpdateCompletedTours).toHaveBeenCalledWith(currentUser, 'tour-2');
    expect(onUserUpdated).toHaveBeenCalledWith({ completedTours: ['tour-1', 'tour-2'] });
  });

  it('resets completed tours through the service layer', async () => {
    const onUserUpdated = vi.fn();
    const { result } = renderHook(() => useProfileViewModel());

    await act(async () => {
      await result.current.resetTours(currentUser, onUserUpdated);
    });

    expect(mockResetTours).toHaveBeenCalledWith(currentUser);
    expect(onUserUpdated).toHaveBeenCalledWith({ completedTours: [] });
  });
});
