import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Activity, Shield, Users, FileText, Radio, LogOut } from 'lucide-react';
import { RetroButton } from './common/RetroButton';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#101411] border-b border-[#27342a] px-4 py-2 flex items-center justify-between sticky top-0 z-50 font-mono text-xs select-none">
      {/* Brand / NOC Terminal Header */}
      <div 
        className="flex items-center gap-2 cursor-pointer text-[#00ff66] hover:text-white transition-colors" 
        onClick={() => navigate('/')}
      >
        <Terminal className="w-4 h-4 text-[#00ff66]" />
        <span className="font-bold tracking-wider uppercase text-sm">SYS.NOC // PORTAL</span>
        <span className="text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1 py-0.5 border border-[#00ff66]/30 rounded-[1px] hidden md:inline">
          LIVE
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <NavLink 
          to="/profiles" 
          className={({ isActive }) => 
            `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
              isActive 
                ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
            }`
          }
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Profiles</span>
        </NavLink>
        
        <NavLink 
          to="/jobs" 
          className={({ isActive }) => 
            `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
              isActive 
                ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
            }`
          }
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Jobs</span>
        </NavLink>

        {['ADMIN', 'OPERATOR'].includes(user.role) && (
          <NavLink 
            to="/agents" 
            className={({ isActive }) => 
              `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                isActive 
                  ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                  : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
              }`
            }
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Agents</span>
          </NavLink>
        )}

        {user.role === 'ADMIN' && (
          <>
            <NavLink 
              to="/users" 
              className={({ isActive }) => 
                `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                  isActive 
                    ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                    : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                }`
              }
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </NavLink>
            <NavLink 
              to="/audit-logs" 
              className={({ isActive }) => 
                `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                  isActive 
                    ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                    : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                }`
              }
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit</span>
            </NavLink>
            <NavLink 
              to="/diagnostics" 
              className={({ isActive }) => 
                `px-2.5 py-1 rounded-[2px] uppercase text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                  isActive 
                    ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/40' 
                    : 'text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]'
                }`
              }
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Status / Logout */}
      <div className="flex items-center gap-3 border-l border-[#27342a] pl-3">
        <div className="text-right hidden sm:block">
          <div className="text-[11px] font-bold text-[#d5e3d8]">{user.username}</div>
          <div className="text-[9px] font-semibold text-[#00ff66] uppercase tracking-widest">
            [{user.role}]
          </div>
        </div>
        <RetroButton variant="ghost" size="sm" onClick={handleLogout} icon={LogOut}>
          Exit
        </RetroButton>
      </div>
    </header>
  );
};

export default Navbar;
