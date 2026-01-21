import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // You can replace this with a proper loading spinner component
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.status === 'PENDING') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.status === 'REJECTED') {
      // You might want to create a specific page for this
      return <Navigate to="/login?error=rejected" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to a 'not authorized' page or to the home page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
