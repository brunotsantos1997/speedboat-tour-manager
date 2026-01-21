import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserRole, UserStatus } from '../../core/domain/User';
import { Toast } from '../components/Toast';

type EditableUser = User & { commissionInput?: string };

export function UserManagementScreen() {
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { getAllUsers, updateUserStatus, updateUserRole, updateUserCommission, currentUser } = useAuth();

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
                  {user.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleStatusChange(user.id, 'APPROVED')} className="text-indigo-600 hover:text-indigo-900 mr-4">Aprovar</button>
                      <button onClick={() => handleStatusChange(user.id, 'REJECTED')} className="text-red-600 hover:text-red-900">Rejeitar</button>
                    </>
                  )}
                   {user.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'REJECTED')}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        disabled={ (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER' }
                      >
                        Desativar
                      </button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
