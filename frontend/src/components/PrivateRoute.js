import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PrivateRoute.css';

const PrivateRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated() || !user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  // Managers, Admin, and Super Admin should have admin access
  const isAdminOrManager = ['admin', 'superadmin', 'manager'].includes(user.role);
  
  if (role === 'admin' && !isAdminOrManager) {
    // User doesn't have admin/manager role - redirect to their dashboard
    const redirectPath = '/user';
    return <Navigate to={redirectPath} replace />;
  }
  
  if (role === 'user' && isAdminOrManager) {
    // Admin/Manager trying to access user route - redirect to admin
    return <Navigate to="/admin" replace />;
  }
  
  if (role && role !== 'admin' && role !== 'user' && user.role !== role) {
    // For other specific roles, check exact match
    const redirectPath = isAdminOrManager ? '/admin' : '/user';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has correct role
  return children;
};

export default PrivateRoute;
