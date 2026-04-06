import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../src/core/domain/User';
import { ProfileService } from '../../../src/core/services/auth/ProfileService';

const mockCredential = vi.fn();
const mockReauthenticate = vi.fn();
const mockFirebaseUpdateEmail = vi.fn();
const mockFirebaseUpdatePassword = vi.fn();
const mockFirebaseUpdateProfile = vi.fn();
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockSanitize = vi.fn((value: string) => value.trim());

vi.mock('../../../src/lib/firebase', () => ({
  auth: {
    currentUser: {
      email: 'self@example.com',
    },
  },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  EmailAuthProvider: {
    credential: (...args: unknown[]) => mockCredential(...args),
  },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticate(...args),
  updateEmail: (...args: unknown[]) => mockFirebaseUpdateEmail(...args),
  updatePassword: (...args: unknown[]) => mockFirebaseUpdatePassword(...args),
  updateProfile: (...args: unknown[]) => mockFirebaseUpdateProfile(...args),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: (...args: unknown[]) => mockSanitize(...args),
  },
}));

const sellerUser: User = {
  id: 'seller-1',
  name: 'Seller',
  email: 'seller@example.com',
  status: 'APPROVED',
  role: 'SELLER',
};

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue('profile-ref');
    mockUpdateDoc.mockResolvedValue(undefined);
    mockFirebaseUpdateProfile.mockResolvedValue(undefined);
    mockFirebaseUpdateEmail.mockResolvedValue(undefined);
    mockFirebaseUpdatePassword.mockResolvedValue(undefined);
    mockReauthenticate.mockResolvedValue(undefined);
    mockCredential.mockReturnValue('credential');
  });

  it('blocks profile edits when the current user cannot edit the target profile', async () => {
    await expect(
      ProfileService.updateProfile(sellerUser, 'user-2', { name: 'Outro Usuario' })
    ).rejects.toThrow('Voce nao tem permissao para atualizar este perfil.');
  });

  it('blocks admin-side email and password changes for another user on the client', async () => {
    const ownerUser: User = {
      ...sellerUser,
      id: 'owner-1',
      role: 'OWNER',
    };

    await expect(
      ProfileService.updateProfile(ownerUser, 'user-2', {
        email: 'novo@example.com',
        oldPassword: 'SenhaAtual123!',
      })
    ).rejects.toThrow(
      'Alteracoes de email e senha de outro usuario exigem backend administrativo e nao podem ser feitas pelo cliente.'
    );

    expect(mockFirebaseUpdateEmail).not.toHaveBeenCalled();
    expect(mockFirebaseUpdatePassword).not.toHaveBeenCalled();
  });

  it('requires the current password before changing the logged user email', async () => {
    await expect(
      ProfileService.updateProfile(sellerUser, sellerUser.id, {
        email: 'novo@example.com',
      })
    ).rejects.toThrow('Senha atual e obrigatoria para alterar o e-mail.');
  });

  it('updates the current user display name in auth and Firestore', async () => {
    const updates = await ProfileService.updateProfile(sellerUser, sellerUser.id, {
      name: '  Nome Atualizado  ',
    });

    expect(mockFirebaseUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'self@example.com' }),
      { displayName: 'Nome Atualizado' }
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith('profile-ref', {
      name: 'Nome Atualizado',
    });
    expect(updates).toEqual({ name: 'Nome Atualizado' });
  });
});
