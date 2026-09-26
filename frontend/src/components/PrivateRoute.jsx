import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Require login
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Require admin role
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
