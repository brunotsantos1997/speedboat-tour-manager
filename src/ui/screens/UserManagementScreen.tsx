import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User, UserRole, UserStatus } from '../../core/domain/User';

export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAllUsers, updateUserStatus, updateUserRole, currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let allUsers = await getAllUsers();

      // Implement visibility rules
      if (currentUser?.role === 'SUPER_ADMIN') {
        // Super admins cannot see the owner
        allUsers = allUsers.filter(user => user.role !== 'OWNER');
      }

      // Filter out the current user from the list to prevent self-modification
      setUsers(allUsers.filter(user => user.id !== currentUser?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await updateUserStatus(userId, status);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred.');
    }
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    disabled={
                      (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                      user.role === 'OWNER'
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    {currentUser?.role === 'OWNER' && (
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    )}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleStatusChange(user.id, 'APPROVED')} className="text-indigo-600 hover:text-indigo-900 mr-4">Approve</button>
                      <button onClick={() => handleStatusChange(user.id, 'REJECTED')} className="text-red-600 hover:text-red-900">Reject</button>
                    </>
                  )}
                   {user.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'REJECTED')}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        disabled={
                            (currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') ||
                             user.role === 'OWNER'
                        }
                      >
                        Disable
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
