import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

// Wraps any route that requires the user to be logged in.
// If adminOnly is true, also checks that the user has the 'admin' role.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
