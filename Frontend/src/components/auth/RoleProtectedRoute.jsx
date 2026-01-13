import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleRedirects = {
      'lawyer': '/lawyer-dashboard',
      'admin': '/admin-dashboard',
      'user': '/user-dashboard'
    };
    
    const userRedirect = roleRedirects[user.role] || '/login';
    return <Navigate to={userRedirect} replace />;
  }

  return children;
};

export default RoleProtectedRoute;