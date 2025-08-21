// [EDIT] - 2024-01-15 - Created ProtectedRoute component - Ediens Team
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireBusiness = false, requirePremium = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check business requirement
  if (requireBusiness && !user?.isBusiness) {
    return (
      <Navigate 
        to="/upgrade-business" 
        state={{ 
          from: location,
          message: 'This feature requires a business account' 
        }} 
        replace 
      />
    );
  }

  // Check premium requirement
  if (requirePremium && !user?.isPremium) {
    return (
      <Navigate 
        to="/upgrade-premium" 
        state={{ 
          from: location,
          message: 'This feature requires a premium subscription' 
        }} 
        replace 
      />
    );
  }

  // User is authenticated and meets all requirements
  return children;
};

export default ProtectedRoute;