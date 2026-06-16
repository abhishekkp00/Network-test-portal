import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Simple placeholders for Phase 1 (to be built out in future phases)
const Home = () => {
  const { user } = useAuth();
  return (
    <div className="container">
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <h1 style={{ marginBottom: '16px' }}>Network Test Automation Portal</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 24px', fontSize: '1.1rem' }}>
          Welcome back, <strong>{user?.username}</strong>! Select a section below to manage network test templates, trigger execution, and review performance telemetry.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '40px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3>Test Profiles</h3>
            <p style={{ fontSize: '0.85rem' }}>Configure Ping and iPerf templates.</p>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3>Test Jobs</h3>
            <p style={{ fontSize: '0.85rem' }}>Run tasks and monitor live status.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPlaceholder = () => (
  <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <h2>Sign In</h2>
      <p style={{ marginBottom: '24px' }}>Phase 2: Authentication views will go here.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" className="form-control" placeholder="Username" disabled />
        <input type="password" className="form-control" placeholder="Password" disabled />
        <button className="btn btn-primary" disabled>Login</button>
      </div>
    </div>
  </div>
);

const RegisterPlaceholder = () => (
  <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <h2>Register Account</h2>
      <p style={{ marginBottom: '24px' }}>Phase 2: Registration views will go here.</p>
    </div>
  </div>
);

const ProfilesPlaceholder = () => (
  <div className="container">
    <div className="glass-panel">
      <h2>Test Profiles</h2>
      <p>Phase 3: Profiles listing and CRUD management will go here.</p>
    </div>
  </div>
);

const JobsPlaceholder = () => (
  <div className="container">
    <div className="glass-panel">
      <h2>Test Jobs</h2>
      <p>Phase 3/4: Job list, overrides, and status tracking will go here.</p>
    </div>
  </div>
);

const UsersPlaceholder = () => (
  <div className="container">
    <div className="glass-panel">
      <h2>User Management</h2>
      <p>Phase 2: Admin panel to toggle status and edit user roles will go here.</p>
    </div>
  </div>
);

const AuditLogsPlaceholder = () => (
  <div className="container">
    <div className="glass-panel">
      <h2>Audit Logs</h2>
      <p>Phase 4: Admin security action logs will go here.</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginPlaceholder />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <RegisterPlaceholder />} 
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
              <ProfilesPlaceholder />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <ProtectedRoute>
              <JobsPlaceholder />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Specific Protected Routes */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPlaceholder />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPlaceholder />
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
