import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import {
  Activity,
  Terminal,
  Radio,
  Users as UsersIcon,
  FileText,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { NocPanel, MetricReadout, StatusIndicator, SectionHeader, RetroButton } from './components/common';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ profilesCount: 0, jobsCount: 0, agentsCount: 0, overallStatus: 'SUCCESS' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/system/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch system stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        code="SYS_DASHBOARD"
        title="Network Operations Workstation"
        subtitle={`Operator Console // ${user?.username}`}
        actions={<StatusIndicator status="ONLINE" text="SYSTEM READY" />}
      />

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricReadout label="PROFILES" value={loading ? '...' : stats.profilesCount} status="neutral" icon={Activity} />
        <MetricReadout label="JOBS EXECUTED" value={loading ? '...' : stats.jobsCount} status="cyan" icon={Terminal} />
        <MetricReadout label="ACTIVE AGENTS" value={loading ? '...' : stats.agentsCount} status="amber" icon={Radio} />
        <MetricReadout
          label="ORCHESTRATOR"
          value={loading ? '...' : (stats.overallStatus === 'SUCCESS' ? 'HEALTHY' : 'DEGRADED')}
          status={stats.overallStatus === 'SUCCESS' ? 'green' : 'red'}
          icon={ShieldCheck}
        />
      </div>

      {/* Main Operational Modules Grid */}
      <NocPanel code="CONSOLE_MODULES" title="NOC Control Modules">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          
          <div 
            onClick={() => navigate('/profiles')}
            className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#00ff66]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#00ff66] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#00ff66]" />
                Test Profiles
              </span>
              <span className="text-[10px] text-[#768a7b]">[MODULE 01]</span>
            </div>
            <p className="text-[11px] text-[#768a7b] leading-normal">
              Configure target hosts, protocol types (PING / iPerf3), packet counts, and automated cron check intervals.
            </p>
          </div>

          <div 
            onClick={() => navigate('/jobs')}
            className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#00bfff]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#00bfff] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#00bfff]" />
                Test Jobs Queue
              </span>
              <span className="text-[10px] text-[#768a7b]">[MODULE 02]</span>
            </div>
            <p className="text-[11px] text-[#768a7b] leading-normal">
              Launch active network diagnostic queries, inspect attempt retries, and review real-time execution outputs.
            </p>
          </div>

          {['ADMIN', 'OPERATOR'].includes(user?.role) && (
            <div 
              onClick={() => navigate('/agents')}
              className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#ffb000]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#ffb000] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#ffb000]" />
                  Subnet Agents
                </span>
                <span className="text-[10px] text-[#768a7b]">[MODULE 03]</span>
              </div>
              <p className="text-[11px] text-[#768a7b] leading-normal">
                Deploy and monitor remote Python vantage agents running across separate subnets for distributed latency probes.
              </p>
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div 
                onClick={() => navigate('/users')}
                className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#00ff66]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#00ff66] flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4 text-[#00ff66]" />
                    User Settings
                  </span>
                  <span className="text-[10px] text-[#768a7b]">[MODULE 04]</span>
                </div>
                <p className="text-[11px] text-[#768a7b] leading-normal">
                  Authorize operator accounts, modify access role levels, and activate/deactivate portal credentials.
                </p>
              </div>

              <div 
                onClick={() => navigate('/audit-logs')}
                className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#ff3333]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#ff3333] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#ff3333]" />
                    Security Audit Trail
                  </span>
                  <span className="text-[10px] text-[#768a7b]">[MODULE 05]</span>
                </div>
                <p className="text-[11px] text-[#768a7b] leading-normal">
                  Inspect state transitions, security token operations, and administrative event logs.
                </p>
              </div>

              <div 
                onClick={() => navigate('/diagnostics')}
                className="p-4 bg-[#101411] border border-[#27342a] hover:border-[#00bfff]/50 rounded-[2px] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#d5e3d8] uppercase group-hover:text-[#00bfff] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00bfff]" />
                    System Diagnostics
                  </span>
                  <span className="text-[10px] text-[#768a7b]">[MODULE 06]</span>
                </div>
                <p className="text-[11px] text-[#768a7b] leading-normal">
                  Run system binary health checks, monitor host resource usage, and stream stdout diagnostics.
                </p>
              </div>
            </>
          )}

        </div>
      </NocPanel>
    </div>
  );
};

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
