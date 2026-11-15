import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../core/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = authService.getUserRole().toUpperCase();
    if (userRole !== requiredRole.toUpperCase()) {
      return <Navigate to="/quiz" replace />;
    }
  }

  return <>{children}</>;
};
