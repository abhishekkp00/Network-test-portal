import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => navigate('/')}>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="var(--color-primary)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>Test Portal 2026</span>
      </div>

      <nav className="nav-links">
        <NavLink 
          to="/profiles" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Test Profiles
        </NavLink>
        
        <NavLink 
          to="/jobs" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Test Jobs
        </NavLink>

        {user.role === 'ADMIN' && (
          <>
            <NavLink 
              to="/users" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              User Management
            </NavLink>
            <NavLink 
              to="/audit-logs" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Audit Logs
            </NavLink>
            <NavLink 
              to="/diagnostics" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Diagnostics
            </NavLink>
          </>
        )}
      </nav>

      <div className="nav-user">
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.username}</div>
          <span 
            className="badge" 
            style={{ 
              fontSize: '0.65rem', 
              padding: '2px 6px',
              backgroundColor: user.role === 'ADMIN' ? 'var(--color-danger-glass)' : 'var(--color-primary-glass)',
              color: user.role === 'ADMIN' ? 'var(--color-danger)' : 'var(--color-primary)'
            }}
          >
            {user.role}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          Logout
        </button>
      </div>
    </header>
  );
};
