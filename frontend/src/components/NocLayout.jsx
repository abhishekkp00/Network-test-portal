import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Terminal,
  Radio,
  Activity,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Cpu,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server,
  X
} from 'lucide-react';
import { StatusIndicator, RetroButton } from './common';

export const NocLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showIncidentsModal, setShowIncidentsModal] = useState(false);
  const [systemStats, setSystemStats] = useState({ profilesCount: 0, jobsCount: 0, agentsCount: 0, overallStatus: 'SUCCESS' });

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch telemetry stats for bottom system status bar
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/system/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSystemStats(data);
        }
      } catch (err) {
        console.error('Stats poll error', err);
      }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 10000);
    return () => clearInterval(statsInterval);
  }, [user]);

  if (!user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formattedUtc = currentTime.toUTCString().replace('GMT', 'UTC');

  const isAdmin = user.role === 'ADMIN';
  const isOperator = ['ADMIN', 'OPERATOR'].includes(user.role);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d0b] text-[#d5e3d8] font-mono text-xs select-none antialiased">
      
      {/* TECHNICAL NOC HEADER */}
      <header className="h-12 bg-[#101411] border-b border-[#27342a] px-3 flex items-center justify-between z-40 shrink-0">
        
        {/* Left Header: Title & System Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-[#1a221d] text-[#768a7b] hover:text-[#00ff66] border border-[#27342a] rounded-[2px] transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-2.5 h-2.5 bg-[#00ff66] rounded-full animate-pulse shadow-[0_0_8px_#00ff66]" />
            <div>
              <div className="font-bold text-[#d5e3d8] tracking-wider text-xs leading-none uppercase">
                NETWORK TEST PORTAL
              </div>
              <div className="text-[9px] text-[#768a7b] tracking-widest leading-none mt-0.5 uppercase">
                NOC CONTROL SYSTEM // v2026.1
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#27342a]">
            <StatusIndicator status="ONLINE" text="NOC ONLINE" />
          </div>
        </div>

        {/* Right Header: Clock, Telemetry Mode & Logged-in User */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right font-mono text-[11px]">
            <span className="text-[#00ff66] font-bold tracking-widest">
              {formattedUtc}
            </span>
            <span className="text-[9px] text-[#768a7b] uppercase tracking-wider">
              SYSTEM TIME // UTC CLOCK
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-[#27342a] pl-4">
            <div className="text-right">
              <div className="font-bold text-[#d5e3d8] text-xs leading-none">{user.username}</div>
              <div className="text-[9px] text-[#00ff66] font-semibold tracking-wider leading-none mt-0.5">
                [{user.role}]
              </div>
            </div>

            <RetroButton 
              variant="ghost" 
              size="sm" 
              icon={LogOut} 
              onClick={handleLogout}
              title="Logout from NOC Console"
            >
              EXIT
            </RetroButton>
          </div>
        </div>
      </header>

      {/* MAIN BODY LAYOUT: SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COMPACT LEFT SIDEBAR */}
        <aside className={`${collapsed ? 'w-14' : 'w-52'} bg-[#101411] border-r border-[#27342a] flex flex-col justify-between transition-all duration-200 shrink-0 z-30`}>
          
          <div className="p-2 space-y-4 overflow-y-auto">
            
            {/* NOC SECTION */}
            <div>
              {!collapsed && (
                <div className="px-2 pb-1 text-[9px] font-bold text-[#768a7b] uppercase tracking-widest border-b border-[#27342a]/60 mb-1">
                  // NOC OPERATIONAL
                </div>
              )}

              <nav className="space-y-0.5">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                      isActive
                        ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                        : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                    }`
                  }
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Dashboard</span>}
                </NavLink>

                <NavLink
                  to="/jobs"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                      isActive
                        ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                        : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                    }`
                  }
                  title="Jobs Queue"
                >
                  <Terminal className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Jobs</span>}
                </NavLink>

                {isOperator && (
                  <NavLink
                    to="/agents"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                        isActive
                          ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                          : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                      }`
                    }
                    title="Subnet Vantage Agents"
                  >
                    <Radio className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">Agents</span>}
                  </NavLink>
                )}

                <NavLink
                  to="/profiles"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                      isActive
                        ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                        : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                    }`
                  }
                  title="Test Profiles"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">Profiles</span>}
                </NavLink>

                <button
                  onClick={() => setShowIncidentsModal(true)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-[#768a7b] hover:text-[#ffb000] hover:bg-[#ffb000]/10 border border-transparent hover:border-[#ffb000]/30 transition-all text-left"
                  title="Incidents Log"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#ffb000]" />
                  {!collapsed && <span className="truncate">Incidents</span>}
                </button>

                {isAdmin && (
                  <NavLink
                    to="/audit-logs"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                        isActive
                          ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                          : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                      }`
                    }
                    title="Audit Trail Logs"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">Audit Log</span>}
                  </NavLink>
                )}
              </nav>
            </div>

            {/* SYSTEM SECTION */}
            {isAdmin && (
              <div>
                {!collapsed && (
                  <div className="px-2 pb-1 text-[9px] font-bold text-[#768a7b] uppercase tracking-widest border-b border-[#27342a]/60 mb-1">
                    // SYSTEM & SETUP
                  </div>
                )}

                <nav className="space-y-0.5">
                  <NavLink
                    to="/diagnostics"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                        isActive
                          ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                          : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                      }`
                    }
                    title="Diagnostics & Processes"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">Diagnostics</span>}
                  </NavLink>

                  <NavLink
                    to="/diagnostics"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-[#768a7b] hover:text-[#d5e3d8] border border-transparent hover:border-[#27342a] transition-all"
                    title="System Health Resources"
                  >
                    <Cpu className="w-4 h-4 shrink-0 text-[#00bfff]" />
                    {!collapsed && <span className="truncate">System Health</span>}
                  </NavLink>

                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                        isActive
                          ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                          : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                      }`
                    }
                    title="User Settings & Authorization"
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">Settings</span>}
                  </NavLink>
                </nav>
              </div>
            )}

          </div>

          {/* Sidebar Footer Info */}
          {!collapsed && (
            <div className="p-2.5 border-t border-[#27342a] bg-[#141a16] text-[10px] text-[#4e5f52] space-y-0.5">
              <div>HOST: PORTAL-CORE</div>
              <div>ENV: PRODUCTION-DOCKER</div>
            </div>
          )}
        </aside>

        {/* RESPONSIVE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#0a0d0b] p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* SYSTEM STATUS BAR (FOOTER TELEMETRY) */}
      <footer className="h-7 bg-[#101411] border-t border-[#27342a] px-3 flex items-center justify-between text-[10px] text-[#768a7b] shrink-0 font-mono z-40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span className="text-[#d5e3d8]">ORCHESTRATOR:</span>
            <span className="text-[#00ff66] font-bold">{systemStats.overallStatus === 'SUCCESS' ? 'ONLINE' : 'DEGRADED'}</span>
          </span>
          <span className="hidden sm:inline text-[#27342a]">|</span>
          <span className="hidden sm:inline">PROFILES: <strong className="text-[#d5e3d8]">{systemStats.profilesCount}</strong></span>
          <span className="hidden sm:inline text-[#27342a]">|</span>
          <span className="hidden sm:inline">JOBS QUEUED: <strong className="text-[#00bfff]">{systemStats.jobsCount}</strong></span>
          <span className="hidden sm:inline text-[#27342a]">|</span>
          <span className="hidden sm:inline">ACTIVE AGENTS: <strong className="text-[#ffb000]">{systemStats.agentsCount}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#4e5f52] hidden md:inline">LATENCY MODE: ICMP / SSE STREAM</span>
          <span className="text-[#00ff66]">SECURE LAYER // HMAC</span>
        </div>
      </footer>

      {/* INCIDENTS MODAL DRAWER */}
      {showIncidentsModal && (
        <div 
          className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowIncidentsModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-[#141a16] border border-[#ffb000]/40 p-4 rounded-[2px] shadow-lg font-mono space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#27342a]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ffb000]" />
                <span className="font-bold text-[#d5e3d8] uppercase text-xs">
                  // NOC Incident Lifecycle Monitor
                </span>
              </div>
              <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setShowIncidentsModal(false)}>
                Close
              </RetroButton>
            </div>

            <div className="space-y-2 text-xs text-[#768a7b]">
              <p>
                Active Incident Deduplication System monitor. Outage spikes in latency (&gt;100ms) or packet loss (&gt;5%) automatically aggregate into structured incidents.
              </p>

              <div className="p-3 bg-[#101411] border border-[#27342a] rounded-[2px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#d5e3d8] font-bold">INCIDENT #109 — Latency Breach Subnet A</span>
                  <StatusIndicator status="RESOLVED" text="RESOLVED" pulse={false} />
                </div>
                <div className="text-[11px]">
                  Target: 8.8.8.8 (ICMP Ping Probe) — First Seen: 10 mins ago — Occurrence Count: 4
                </div>
              </div>

              <div className="p-3 bg-[#101411] border border-[#27342a] rounded-[2px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#d5e3d8] font-bold">INCIDENT #110 — Packet Loss Spikes Oregon Node</span>
                  <StatusIndicator status="OPEN" text="ACTIVE ALERTS" />
                </div>
                <div className="text-[11px]">
                  Target: iperf.server.net — Packet Loss: 8.4% — Threshold: 5.0%
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#27342a] flex justify-end">
              <RetroButton variant="primary" onClick={() => setShowIncidentsModal(false)}>
                Acknowledge Alerts
              </RetroButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NocLayout;
