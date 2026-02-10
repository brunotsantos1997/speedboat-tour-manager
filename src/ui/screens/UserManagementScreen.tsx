import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserRole, UserStatus } from '../../core/domain/User';
import { Toast } from '../components/Toast';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InformationModal } from '../components/InformationModal';

export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'reset' | 'approve' | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | undefined>('');
  const { getAllUsers, updateUserStatus, updateUserRole, currentUser, approvePasswordReset } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let allUsers = await getAllUsers();
      const otherUsers = allUsers
        .filter(user => user.id !== currentUser?.id);
      setUsers(otherUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar usuários.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    const user = users.find(u => u.id === userId);
    if (user?.role === 'OWNER' && currentUser?.role !== 'OWNER') {
        setToastMessage('Você não tem permissão para alterar o status do proprietário.');
        return;
    }
    try {
      await updateUserStatus(userId, status);
      setToastMessage('Status do usuário atualizado!');
      fetchUsers();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (user?.role === 'OWNER' && currentUser?.role !== 'OWNER') {
        setToastMessage('Você não tem permissão para alterar o cargo do proprietário.');
        return;
    }
    try {
      await updateUserRole(userId, role);
      setToastMessage('Cargo do usuário atualizado!');
      fetchUsers();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Erro ao atualizar cargo.');
    }
  };

  const handleApproveReset = (user: User) => {
    setSelectedUser(user);
    setModalAction('approve');
    setIsConfirmModalOpen(true);
  };

  const confirmModalAction = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      let tempPassword;
      if (modalAction === 'approve') {
        tempPassword = await approvePasswordReset(currentUser.id, selectedUser.id);
        setToastMessage('Redefinição de senha aprovada com sucesso!');
      }
      setTemporaryPassword(tempPassword || '');
      setIsInfoModalOpen(true);
      fetchUsers();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Falha ao executar a ação.');
    } finally {
      setIsConfirmModalOpen(false);
    }
  };


  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmModalAction}
        title={modalAction === 'approve' ? 'Aprovar Redefinição de Senha' : 'Confirmar Ação'}
        message={`Tem certeza que deseja ${modalAction === 'approve' ? 'aprovar a redefinição de senha' : 'executar esta ação'} para o usuário ${selectedUser?.name}?`}
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="text-gray-500">Gerencie permissões e aprove novos membros da equipe</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{user.name}</span>
                        <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {user.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="border border-gray-300 rounded-lg p-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={
                        (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                        (currentUser?.role === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) ||
                        user.role === 'OWNER'
                    }
                  >
                    <option value="SELLER">VENDEDOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                    {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                    {user.role === 'OWNER' && <option value="OWNER">PROPRIETÁRIO</option>}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    {user.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleStatusChange(user.id, 'APPROVED')} className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors">Aprovar</button>
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
                    {user.status === 'PASSWORD_RESET_REQUESTED' && (
                      <button
                        onClick={() => handleApproveReset(user)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={
                          (currentUser?.role === 'ADMIN' && user.role !== 'ADMIN') ||
                          (currentUser?.role === 'SUPER_ADMIN' && user.role === 'OWNER')
                        }
                      >
                        Aprovar Redefinição
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  user.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
              }`}>
                  {user.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                  disabled={
                      (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                      (currentUser?.role === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) ||
                      user.role === 'OWNER'
                  }
                >
                  <option value="SELLER">VENDEDOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                  {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                  {user.role === 'OWNER' && <option value="OWNER">PROPRIETÁRIO</option>}
                </select>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {user.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(user.id, 'APPROVED')}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleStatusChange(user.id, 'REJECTED')}
                      className="flex-1 border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm"
                    >
                      Rejeitar
                    </button>
                  </>
                )}
                {user.status === 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'REJECTED')}
                    className="w-full border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                    disabled={(currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') || user.role === 'OWNER'}
                  >
                    Desativar Usuário
                  </button>
                )}
                {user.status === 'REJECTED' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'APPROVED')}
                    className="w-full border border-green-200 text-green-600 px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Reativar Usuário
                  </button>
                )}
                {user.status === 'PASSWORD_RESET_REQUESTED' && (
                  <button
                    onClick={() => handleApproveReset(user)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                    disabled={
                      (currentUser?.role === 'ADMIN' && user.role !== 'ADMIN') ||
                      (currentUser?.role === 'SUPER_ADMIN' && user.role === 'OWNER')
                    }
                  >
                    Aprovar Redefinição de Senha
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
