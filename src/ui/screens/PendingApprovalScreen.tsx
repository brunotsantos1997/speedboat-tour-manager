import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function PendingApprovalScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Pending Approval</h1>
        <p className="text-gray-600">
          Your account has been created and is waiting for an administrator's approval.
        </p>
        <p className="text-gray-600">
          You will be able to log in once your account is approved.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-2 mt-4 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
