import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Terminal,
  Radio,
  Activity,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StatusIndicator, RetroButton } from './common';

// Data-driven navigation configuration
const NAV_SECTIONS = [
  {
    title: 'NOC',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/jobs', label: 'Jobs', icon: Terminal },
      { to: '/agents', label: 'Agents', icon: Radio, roles: ['ADMIN', 'OPERATOR'] },
      { to: '/profiles', label: 'Profiles', icon: Activity },
      { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
      { to: '/audit-logs', label: 'Audit Log', icon: FileText, roles: ['ADMIN'] },
    ]
  },
  {
    title: 'SYSTEM',
    roles: ['ADMIN'],
    items: [
      { to: '/diagnostics', label: 'Diagnostics', icon: ShieldCheck, roles: ['ADMIN'] },
      { to: '/users', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
    ]
  }
];

export const NocLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState({
    profilesCount: 0,
    jobsCount: 0,
    agentsCount: 0,
    overallStatus: 'SUCCESS'
  });

  // Update UTC live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch telemetry stats for system status footer
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

  const isItemVisible = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  };

  const isSectionVisible = (section) => {
    if (!section.roles) return true;
    return section.roles.includes(user.role);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d0b] text-[#d5e3d8] font-sans text-xs select-none antialiased">
      
      {/* 1. COMPACT TECHNICAL NOC HEADER */}
      <header className="h-12 bg-[#101411] border-b border-[#27342a] px-3 flex items-center justify-between z-40 shrink-0 font-sans">
        
        {/* Left Identity Bar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-[#1a221d] text-[#768a7b] hover:text-[#00ff66] border border-[#27342a] rounded-[2px] transition-colors focus-visible:outline-none"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-2.5 h-2.5 bg-[#00ff66] rounded-full animate-pulse shadow-[0_0_8px_#00ff66]" />
            <div>
              <div className="font-bold text-[#d5e3d8] tracking-wider text-xs leading-none uppercase font-sans">
                NETWORK TEST PORTAL
              </div>
              <div className="text-[9px] text-[#768a7b] tracking-widest leading-none mt-0.5 uppercase font-mono">
                NOC CONTROL SYSTEM // v2026.1
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#27342a]">
            <StatusIndicator status="ONLINE" text="NOC ONLINE" />
          </div>
        </div>

        {/* Right Info Bar & User Status */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right font-mono text-[11px]">
            <span className="text-[#00ff66] font-bold tracking-wider">
              {formattedUtc}
            </span>
            <span className="text-[9px] text-[#768a7b] uppercase tracking-wider">
              SYSTEM TIME // UTC CLOCK
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-[#27342a] pl-4">
            <div className="text-right font-mono">
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

      {/* 2. MAIN LAYOUT CONTAINER: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLLAPSIBLE SIDEBAR WITH DATA-DRIVEN NAVIGATION */}
        <aside className={`${collapsed ? 'w-14' : 'w-52'} bg-[#101411] border-r border-[#27342a] flex flex-col justify-between transition-all duration-200 shrink-0 z-30 font-sans`}>
          
          <div className="p-2 space-y-4 overflow-y-auto">
            {NAV_SECTIONS.filter(isSectionVisible).map((section, idx) => (
              <div key={idx}>
                {!collapsed && (
                  <div className="px-2 pb-1 text-[9px] font-bold text-[#768a7b] uppercase tracking-widest border-b border-[#27342a]/60 mb-1 font-mono">
                    // {section.title}
                  </div>
                )}

                <nav className="space-y-0.5">
                  {section.items.filter(isItemVisible).map((item, itemIdx) => {
                    const IconComponent = item.icon;
                    return (
                      <NavLink
                        key={itemIdx}
                        to={item.to}
                        end={item.exact}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] transition-all border ${
                            isActive
                              ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40 font-bold'
                              : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                          }`
                        }
                        title={item.label}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate font-sans text-xs">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Meta */}
          {!collapsed && (
            <div className="p-2.5 border-t border-[#27342a] bg-[#141a16] text-[10px] text-[#4e5f52] font-mono space-y-0.5">
              <div>HOST: PORTAL-CORE</div>
              <div>ENV: PRODUCTION-DOCKER</div>
            </div>
          )}
        </aside>

        {/* RESPONSIVE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#0a0d0b] p-4 md:p-6 font-sans">
          {children}
        </main>
      </div>

      {/* 3. SYSTEM STATUS FOOTER */}
      <footer className="h-7 bg-[#101411] border-t border-[#27342a] px-3 flex items-center justify-between text-[10px] text-[#768a7b] shrink-0 font-mono z-40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span className="text-[#d5e3d8]">ORCHESTRATOR:</span>
            <span className="text-[#00ff66] font-bold">
              {systemStats.overallStatus === 'SUCCESS' ? 'ONLINE' : 'DEGRADED'}
            </span>
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

    </div>
  );
};

export default NocLayout;
