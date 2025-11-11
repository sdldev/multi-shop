import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * RoleBasedRoute - Redirects staff users to mobile view
 * Admin users get the desktop Layout with full access
 * Staff users are redirected to /staff-mobile
 */
export default function RoleBasedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is staff, redirect to mobile view
  if (user?.role === 'staff') {
    return <Navigate to="/staff-mobile" replace />;
  }

  // Admin gets the full layout
  return children;
}
