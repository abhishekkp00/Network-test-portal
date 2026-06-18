import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Users } from './pages/Users';
import { Profiles } from './pages/Profiles';
import { Jobs } from './pages/Jobs';
import { AuditLogs } from './pages/AuditLogs';
import { Diagnostics } from './pages/Diagnostics';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 40px', background: 'var(--bg-glass)' }}>
        <h1 style={{ marginBottom: '16px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem' }}>
          Network Test Automation Portal
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto 32px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>! Select an operational panel below to configure test execution scripts, schedule diagnostics, or review audit trails.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/profiles')}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h3>Test Profiles</h3>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
              Configure targets, protocols (PING/iperf3), and default run limits.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/jobs')}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-info-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3>Test Jobs</h3>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
              Launch active network queries and poll status telemetry in real-time.
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <>
              <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/users')}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-success-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>User Management</h3>
                <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
                  Manage authorization levels, toggle accounts, and inspect active operators.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/audit-logs')}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-danger-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3>Audit Logs</h3>
                <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
                  Inspect platform history, state changes, and operator action details.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/diagnostics')}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-warning-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <h3>Diagnostics</h3>
                <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
                  Verify system tool access, Python integrations, and command paths.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profiles" 
          element={
            <ProtectedRoute>
              <Profiles />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Specific Protected Routes */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/diagnostics" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Diagnostics />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
