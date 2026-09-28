import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Require login
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  return (user && token) ? children : <Navigate to="/login" replace />;
}

// Require admin role
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
