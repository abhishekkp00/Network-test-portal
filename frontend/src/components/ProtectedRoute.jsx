import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '12px' }}>
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-secondary)' }}>Securing connection...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save current location to return to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // BUG FIX: previously rendered <Navigate> inside a <div> which is a no-op.
    // Navigate must be the *returned* element to trigger routing.
    return <Navigate to="/" replace />;
  }

  return children;
};

