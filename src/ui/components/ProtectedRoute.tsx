import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import React from 'react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  if (currentUser.status === 'PENDING') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.status === 'REJECTED') {
      return <Navigate to="/login?error=rejected" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
