import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserRole, UserStatus } from '../../core/domain/User';
import { Toast } from '../components/Toast';
import { Tutorial } from '../components/Tutorial';
import { userManagementSteps } from '../tutorials/userManagementSteps';

const getStatusBadgeClass = (status: UserStatus) => {
  if (status === 'APPROVED') return 'bg-green-100 text-green-800';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { getAllUsers, updateUserStatus, updateUserRole, currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter((user) => user.id !== currentUser?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar usuarios.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    const user = users.find((candidate) => candidate.id === userId);

    if (user?.role === 'OWNER' && currentUser?.role !== 'OWNER') {
      setToastMessage('Voce nao tem permissao para alterar o status do proprietario.');
      return;
    }

    try {
      await updateUserStatus(userId, status);
      setToastMessage('Status do usuario atualizado.');
      fetchUsers();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const user = users.find((candidate) => candidate.id === userId);

    if (user?.role === 'OWNER' && currentUser?.role !== 'OWNER') {
      setToastMessage('Voce nao tem permissao para alterar o cargo do proprietario.');
      return;
    }

    try {
      await updateUserRole(userId, role);
      setToastMessage('Cargo do usuario atualizado.');
      fetchUsers();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Erro ao atualizar cargo.');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <Tutorial tourId="user-management" steps={userManagementSteps} />
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuarios</h1>
        <p className="text-gray-500">Gerencie permissoes e aprove novos membros da equipe.</p>
      </div>

      <div
        className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block"
        data-tour="users-table"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Usuario
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                data-tour="user-status"
              >
                Status
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                data-tour="user-role"
              >
                Cargo
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                data-tour="user-actions"
              >
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{user.name}</span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(user.status)}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="rounded-lg border border-gray-300 bg-white p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={
                      (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                      (currentUser?.role === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) ||
                      user.role === 'OWNER'
                    }
                  >
                    <option value="SELLER">VENDEDOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                    {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && (
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    )}
                    {user.role === 'OWNER' && <option value="OWNER">PROPRIETARIO</option>}
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    {user.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(user.id, 'APPROVED')}
                          className="rounded-md bg-indigo-600 px-3 py-1 text-white transition-colors hover:bg-indigo-700"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {user.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'REJECTED')}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        disabled={
                          (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER'
                        }
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(user.status)}`}
              >
                {user.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Cargo</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                  disabled={
                    (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                    (currentUser?.role === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) ||
                    user.role === 'OWNER'
                  }
                >
                  <option value="SELLER">VENDEDOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                  {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && (
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  )}
                  {user.role === 'OWNER' && <option value="OWNER">PROPRIETARIO</option>}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {user.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(user.id, 'APPROVED')}
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleStatusChange(user.id, 'REJECTED')}
                      className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600"
                    >
                      Rejeitar
                    </button>
                  </>
                )}
                {user.status === 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'REJECTED')}
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                    disabled={
                      (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER'
                    }
                  >
                    Desativar Usuario
                  </button>
                )}
                {user.status === 'REJECTED' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'APPROVED')}
                    className="w-full rounded-lg border border-green-200 px-4 py-2 text-sm font-bold text-green-600"
                  >
                    Reativar Usuario
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
