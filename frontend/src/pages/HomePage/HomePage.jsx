// frontend/src/pages/HomePage/HomePage.jsx
// Fallback home — redirects based on role via App.js RoleBasedRedirect

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const HomePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser?.role === 'landlord') navigate('/landlord-home', { replace: true });
    else navigate('/student-home', { replace: true });
  }, [currentUser, navigate]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-cream">
      <div role="status" aria-label="Loading" className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
    </div>
  );
};

export default HomePage;
