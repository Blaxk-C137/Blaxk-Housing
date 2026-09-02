// frontend/src/components/PublicRoute.jsx
// Redirects authenticated users away from public-only pages (login, landing)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PublicRoute = ({ children }) => {
  const { currentUser, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
      </div>
    );
  }

  if (currentUser) {
    const dest = currentUser.role === 'landlord' ? '/landlord-home' : '/student-home';
    return <Navigate to={dest} replace />;
  }

  return children;
};

export default PublicRoute;
