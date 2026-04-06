import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../src/core/domain/User';
import { useUserManagementViewModel } from '../../../src/viewmodels/useUserManagementViewModel';

const mockGetAllUsers = vi.fn();
const mockUpdateUserStatus = vi.fn();
const mockUpdateUserRole = vi.fn();
const mockUpdateUserCommissionSettings = vi.fn();

vi.mock('../../../src/core/services/auth/UserManagementService', () => ({
  UserManagementService: {
    getAllUsers: (...args: unknown[]) => mockGetAllUsers(...args),
    updateUserStatus: (...args: unknown[]) => mockUpdateUserStatus(...args),
    updateUserRole: (...args: unknown[]) => mockUpdateUserRole(...args),
    updateUserCommissionSettings: (...args: unknown[]) => mockUpdateUserCommissionSettings(...args),
  },
}));

const currentUser: User = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  status: 'APPROVED',
  role: 'ADMIN',
};

describe('useUserManagementViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllUsers.mockResolvedValue([]);
    mockUpdateUserStatus.mockResolvedValue(undefined);
    mockUpdateUserRole.mockResolvedValue(undefined);
    mockUpdateUserCommissionSettings.mockResolvedValue(undefined);
  });

  it('loads users through the service layer', async () => {
    const expectedUsers = [currentUser];
    mockGetAllUsers.mockResolvedValue(expectedUsers);

    const { result } = renderHook(() => useUserManagementViewModel());
    let loadedUsers: User[] = [];

    await act(async () => {
      loadedUsers = await result.current.getAllUsers(currentUser);
    });

    expect(mockGetAllUsers).toHaveBeenCalledWith(currentUser);
    expect(loadedUsers).toEqual(expectedUsers);
  });

  it('delegates status updates', async () => {
    const { result } = renderHook(() => useUserManagementViewModel());

    await act(async () => {
      await result.current.updateUserStatus(currentUser, 'user-2', 'REJECTED');
    });

    expect(mockUpdateUserStatus).toHaveBeenCalledWith(currentUser, 'user-2', 'REJECTED');
  });

  it('delegates role updates', async () => {
    const { result } = renderHook(() => useUserManagementViewModel());

    await act(async () => {
      await result.current.updateUserRole(currentUser, 'user-2', 'SELLER');
    });

    expect(mockUpdateUserRole).toHaveBeenCalledWith(currentUser, 'user-2', 'SELLER');
  });

  it('delegates commission setting updates', async () => {
    const settings = {
      rentalEnabled: true,
      rentalPercentage: 10,
      rentalBase: 'GROSS' as const,
      deductRentalCost: false,
      productEnabled: true,
      productPercentage: 5,
      productBase: 'NET' as const,
      deductProductCost: true,
      taxEnabled: false,
      taxPercentage: 0,
      deductTaxCost: false,
    };

    const { result } = renderHook(() => useUserManagementViewModel());

    await act(async () => {
      await result.current.updateUserCommissionSettings(currentUser, 'user-2', settings);
    });

    expect(mockUpdateUserCommissionSettings).toHaveBeenCalledWith(currentUser, 'user-2', settings);
  });
});
