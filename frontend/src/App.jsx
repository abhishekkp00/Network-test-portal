import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NocLayout } from './components/NocLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Users } from './pages/Users';
import { Profiles } from './pages/Profiles';
import { Jobs } from './pages/Jobs';
import { AuditLogs } from './pages/AuditLogs';
import { Diagnostics } from './pages/Diagnostics';
import { Agents } from './pages/Agents';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';

const AppContent = () => {
  const { user } = useAuth();
  
  return (
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

      {/* Protected Routes inside NOC Layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <NocLayout>
              <Dashboard />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profiles" 
        element={
          <ProtectedRoute>
            <NocLayout>
              <Profiles />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/jobs" 
        element={
          <ProtectedRoute>
            <NocLayout>
              <Jobs />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/incidents" 
        element={
          <ProtectedRoute>
            <NocLayout>
              <Incidents />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Role Protected Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NocLayout>
              <Users />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit-logs" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NocLayout>
              <AuditLogs />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/diagnostics" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NocLayout>
              <Diagnostics />
            </NocLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/agents" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
            <NocLayout>
              <Agents />
            </NocLayout>
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
