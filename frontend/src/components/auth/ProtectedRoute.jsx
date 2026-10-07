import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_REDIRECTS = {
  administrator: '/admin/dashboard',
  caretaker: '/caretaker/dashboard',
  resident: '/resident/dashboard',
};

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_REDIRECTS[user.role] || '/login'} replace />;
  }

  return children;
}
