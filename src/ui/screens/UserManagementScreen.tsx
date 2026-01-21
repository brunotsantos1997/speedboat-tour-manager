import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserRole, UserStatus } from '../../core/domain/User';
import { Toast } from '../components/Toast';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InformationModal } from '../components/InformationModal';

type EditableUser = User & { commissionInput?: string };

export function UserManagementScreen() {
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');
  const { getAllUsers, updateUserStatus, updateUserRole, updateUserCommission, currentUser, resetPassword } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let allUsers = await getAllUsers();
      if (currentUser?.role === 'SUPER_ADMIN') {
        allUsers = allUsers.filter(user => user.role !== 'OWNER');
      }
      const editableUsers = allUsers
        .filter(user => user.id !== currentUser?.id)
        .map(user => ({ ...user, commissionInput: (user.commissionPercentage ?? 0).toString() }));
      setUsers(editableUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await updateUserStatus(userId, status);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const handleCommissionInputChange = (userId: string, value: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, commissionInput: value } : u))
    );
  };

  const handleCommissionSave = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || user.commissionInput === undefined) return;

    const commissionValue = parseFloat(user.commissionInput);
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      setToastMessage('Please enter a valid commission percentage (0-100).');
      return;
    }

    try {
      await updateUserCommission(userId, commissionValue);
      setToastMessage('Commission updated successfully!');
      fetchUsers(); // Refresh to confirm the change
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to update commission.');
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsConfirmModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const tempPassword = await resetPassword(selectedUser.id);
      setTemporaryPassword(tempPassword);
      setIsInfoModalOpen(true);
      setToastMessage('Senha resetada com sucesso!');
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Falha ao resetar a senha.');
    } finally {
      setIsConfirmModalOpen(false);
    }
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmResetPassword}
        title="Resetar Senha"
        message={`Tem certeza que deseja resetar a senha para o usuário ${selectedUser?.name}? Esta ação não pode ser desfeita.`}
      />

      <InformationModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setSelectedUser(null);
        }}
        title="Senha Resetada com Sucesso"
        message={
          <>
            <p>A nova senha temporária para <strong>{selectedUser?.name}</strong> é:</p>
            <p className="my-2 p-2 bg-gray-100 rounded font-mono text-center">{temporaryPassword}</p>
            <p className="text-sm text-gray-500">Por favor, copie esta senha e a envie para o usuário. Ele será solicitado a trocá-la no próximo login.</p>
          </>
        }
      />

      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="border border-gray-300 rounded-md p-1"
                    disabled={ (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER' }
                  >
                    <option value="ADMIN">ADMIN</option>
                    {currentUser?.role === 'OWNER' && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={user.commissionInput}
                      onChange={(e) => handleCommissionInputChange(user.id, e.target.value)}
                      className="w-20 border border-gray-300 rounded-md p-1"
                      disabled={user.role === 'OWNER'}
                    />
                    <button
                      onClick={() => handleCommissionSave(user.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      disabled={user.role === 'OWNER'}
                    >
                      Salvar
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    {user.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleStatusChange(user.id, 'APPROVED')} className="text-indigo-600 hover:text-indigo-900">Aprovar</button>
                        <button onClick={() => handleStatusChange(user.id, 'REJECTED')} className="text-red-600 hover:text-red-900">Rejeitar</button>
                      </>
                    )}
                    {user.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'REJECTED')}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        disabled={(currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER'}
                      >
                        Desativar
                      </button>
                    )}
                    {user.status === 'REJECTED' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'APPROVED')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reativar
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      disabled={user.role === 'OWNER' || (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN')}
                    >
                      Resetar Senha
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
