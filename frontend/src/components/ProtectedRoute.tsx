import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = sessionStorage.getItem('token');
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true' && token;

  if (!isAuthenticated) {
    // Clear any stale session data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
