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
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', borderColor: 'var(--color-danger)' }}>
          <h2 style={{ color: 'var(--color-danger)' }}>Access Denied</h2>
          <p>Your account role (<strong>{user.role}</strong>) does not have access to view this resource.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};
