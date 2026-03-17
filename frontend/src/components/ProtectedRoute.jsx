import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // Save the attempted location for potential redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // With user persistence fixed in the store, 'user' object should be present if logged in.
  // If user object is missing, we shouldn't allow the render as we can't verify the role.
  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Strictly verify the role against allowed roles
  const hasAccess = allowedRoles ? (allowedRoles.includes(user.role) || user.role === 'admin') : true;

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
