import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Activity,
  Terminal,
  Radio,
  AlertTriangle,
  RotateCw,
  Cpu,
  Server,
  HardDrive,
  CheckCircle2,
  XCircle,
  Network,
  ShieldCheck
} from 'lucide-react';
import { NocPanel, MetricReadout, StatusIndicator, SectionHeader, RetroButton } from '../components/common';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, jobsRes, agentsRes, profilesRes] = await Promise.allSettled([
        api.get('/system/stats'),
        api.get('/jobs'),
        api.get('/agents'),
        api.get('/profiles')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (jobsRes.status === 'fulfilled') {
        const sortedJobs = (jobsRes.value || []).sort((a, b) => b.id - a.id);
        setJobs(sortedJobs);
      }
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value || []);
      if (profilesRes.status === 'fulfilled') setProfiles(profilesRes.value || []);

    } catch (err) {
      setError(err.message || 'Telemetry acquisition failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute real metrics from backend telemetry
  const activeAgentsCount = agents.filter(a => a.status === 'ONLINE').length;
  const runningJobsCount = jobs.filter(j => j.status === 'RUNNING').length;
  const pendingJobsCount = jobs.filter(j => j.status === 'PENDING').length;
  
  const finishedJobs = jobs.filter(j => ['SUCCESS', 'FAILED', 'TIMEOUT', 'STALE'].includes(j.status));
  const successJobs = jobs.filter(j => j.status === 'SUCCESS').length;
  const successRate = finishedJobs.length > 0 ? Math.round((successJobs / finishedJobs.length) * 100) : null;

  // Active Incidents derived from jobs in FAILED, TIMEOUT, or STALE status
  const incidents = jobs.filter(j => ['FAILED', 'TIMEOUT', 'STALE'].includes(j.status));

  // Targets derived from profiles
  const targets = profiles.map(p => ({
    name: p.name,
    target: p.host || p.server || 'NO DATA',
    protocol: p.protocol
  })).slice(0, 4);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString();
  };

  if (loading && !stats && jobs.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Initializing NOC Control Console Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* 1. COMPACT SYSTEM STATUS HEADER */}
      <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#00ff66] rounded-full animate-pulse shadow-[0_0_8px_#00ff66]" />
          <div>
            <div className="font-bold text-[#d5e3d8] text-sm uppercase tracking-wider">
              NOC CONTROL CONSOLE // CONSOLE-ID #081
            </div>
            <div className="text-[10px] text-[#768a7b]">
              SUB-INTERFACE TELEMETRY MONITOR // DISPATCHER STATE: ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator status={stats?.overallStatus === 'SUCCESS' ? 'ONLINE' : 'DEGRADED'} text={stats?.overallStatus === 'SUCCESS' ? 'NOC ONLINE' : 'ORCHESTRATOR DEGRADED'} />
          <RetroButton variant="secondary" size="sm" icon={RotateCw} onClick={fetchDashboardData} disabled={loading}>
            Sync Telemetry
          </RetroButton>
        </div>
      </div>

      {/* 2. KPI INSTRUMENTATION STRIP (COMPACT READOUTS - NO ROUNDED SAAS CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <MetricReadout
          label="ACTIVE AGENTS"
          value={agents.length > 0 ? `${activeAgentsCount} / ${agents.length}` : '0 / 0'}
          status={activeAgentsCount > 0 ? 'green' : 'amber'}
          icon={Radio}
          subtext={agents.length > 0 ? `${agents.length - activeAgentsCount} Offline` : 'No agents'}
        />

        <MetricReadout
          label="RUNNING JOBS"
          value={runningJobsCount}
          status={runningJobsCount > 0 ? 'cyan' : 'neutral'}
          icon={Activity}
          subtext={`${pendingJobsCount} Pending in Queue`}
        />

        <MetricReadout
          label="SUCCESS RATE"
          value={successRate !== null ? `${successRate}%` : 'N/A'}
          status={successRate !== null && successRate >= 90 ? 'green' : successRate !== null ? 'amber' : 'neutral'}
          icon={CheckCircle2}
          subtext={finishedJobs.length > 0 ? `${finishedJobs.length} Runs Evaluated` : 'No Runs'}
        />

        <MetricReadout
          label="AVERAGE RTT"
          value="N/A"
          status="neutral"
          icon={Terminal}
          subtext="Telemetry Stream"
        />

        <MetricReadout
          label="PACKET LOSS"
          value={incidents.length > 0 ? 'FAIL' : '0%'}
          status={incidents.length > 0 ? 'red' : 'green'}
          icon={AlertTriangle}
          subtext={incidents.length > 0 ? `${incidents.length} Breaches` : '0 Breaches'}
        />

        <MetricReadout
          label="INCIDENTS"
          value={incidents.length}
          status={incidents.length > 0 ? 'red' : 'green'}
          icon={AlertTriangle}
          subtext={incidents.length > 0 ? 'Active Investigation' : 'Normal State'}
        />
      </div>

      {/* 3. NETWORK TOPOLOGY VISUAL CENTERPIECE */}
      <NocPanel
        code="TOPOLOGY_MAP"
        title="Distributed Network Topology // Controller → Agents → Targets"
        badge={<StatusIndicator status="ACTIVE" text="TELEMETRY LINK" />}
      >
        <div className="py-4 px-2">
          {agents.length === 0 && targets.length === 0 ? (
            <div className="text-center text-[#768a7b] py-8">
              NO TOPOLOGY NODES DETECTED. Provision agents and profiles to map subnet links.
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-x-auto">
              
              {/* Node 1: Controller Node */}
              <div className="w-full lg:w-56 p-3 bg-[#101411] border border-[#00ff66]/50 rounded-[2px] space-y-1 text-center shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-[#00ff66] font-bold">
                  <Server className="w-4 h-4" />
                  <span>[PORTAL CORE]</span>
                </div>
                <div className="text-[10px] text-[#d5e3d8]">localhost:8082</div>
                <div className="text-[9px] text-[#768a7b]">SYSTEM ORCHESTRATOR</div>
                <div className="pt-1 flex justify-center">
                  <StatusIndicator status="ONLINE" text="MASTER" pulse />
                </div>
              </div>

              {/* Cable 1: Controller -> Agents */}
              <div className="hidden lg:block flex-1 h-[2px] bg-[#27342a] relative min-w-16">
                <div className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66] animate-[packetStream_2s_infinite_linear]" />
              </div>

              {/* Node 2: Subnet Agents Column */}
              <div className="w-full lg:w-64 space-y-2 shrink-0">
                <div className="text-[10px] text-[#768a7b] font-bold uppercase tracking-wider text-center lg:text-left">
                  // SUBNET VANTAGE AGENTS ({agents.length})
                </div>
                {agents.length === 0 ? (
                  <div className="p-2 bg-[#101411] border border-[#27342a] text-center text-[#768a7b] text-[10px]">
                    NO AGENTS REGISTERED
                  </div>
                ) : (
                  agents.slice(0, 3).map(agent => (
                    <div key={agent.id} className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#d5e3d8] truncate">{agent.name}</div>
                        <div className="text-[10px] text-[#768a7b] truncate">{agent.description || 'Subnet Probe'}</div>
                      </div>
                      <StatusIndicator status={agent.status || 'OFFLINE'} pulse={agent.status === 'ONLINE'} />
                    </div>
                  ))
                )}
              </div>

              {/* Cable 2: Agents -> Targets */}
              <div className="hidden lg:block flex-1 h-[2px] bg-[#27342a] relative min-w-16">
                <div className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-[#00bfff] shadow-[0_0_8px_#00bfff] animate-[packetStream_2.5s_infinite_linear]" />
              </div>

              {/* Node 3: Target Hosts Column */}
              <div className="w-full lg:w-64 space-y-2 shrink-0">
                <div className="text-[10px] text-[#768a7b] font-bold uppercase tracking-wider text-center lg:text-left">
                  // DIAGNOSTIC TARGETS ({profiles.length})
                </div>
                {targets.length === 0 ? (
                  <div className="p-2 bg-[#101411] border border-[#27342a] text-center text-[#768a7b] text-[10px]">
                    NO PROFILES CONFIGURED
                  </div>
                ) : (
                  targets.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] flex items-center justify-between text-xs">
                      <div className="truncate">
                        <div className="font-bold text-[#00bfff] truncate">{t.target}</div>
                        <div className="text-[10px] text-[#768a7b] truncate">{t.name}</div>
                      </div>
                      <span className="text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 border border-[#00ff66]/30 rounded-[1px] font-bold">
                        [{t.protocol}]
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </NocPanel>

      {/* LOWER PANELS GRID: 4. Recent Jobs | 5. Active Incidents | 6. System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* 4. RECENT JOBS TABLE (8 COLS) */}
        <div className="lg:col-span-8">
          <NocPanel
            code="RECENT_EXEC"
            title="Recent Diagnostic Jobs"
            action={
              <RetroButton variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
                View All Jobs →
              </RetroButton>
            }
            noPadding
          >
            <div className="table-container border-0 rounded-none">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>JOB ID</th>
                    <th>PROFILE</th>
                    <th>TARGET</th>
                    <th>STATUS</th>
                    <th>EXECUTOR</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-[#768a7b]">
                        NO DATA AVAILABLE
                      </td>
                    </tr>
                  ) : (
                    jobs.slice(0, 5).map((j) => (
                      <tr key={j.id}>
                        <td className="font-bold text-[#00ff66]">#{j.id}</td>
                        <td className="font-semibold text-[#d5e3d8]">{j.profileName || `Profile #${j.profileId}`}</td>
                        <td className="text-[#00bfff]">{j.hostOverride || j.serverOverride || 'Default'}</td>
                        <td><StatusIndicator status={j.status} /></td>
                        <td className="text-[#768a7b]">{j.agentName ? `Agent: ${j.agentName}` : j.executedByUsername || 'Core'}</td>
                        <td className="text-[#768a7b] text-[11px]">{formatDateTime(j.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </NocPanel>
        </div>

        {/* RIGHT COLUMN: 5. ACTIVE INCIDENTS & 6. SYSTEM HEALTH (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 5. ACTIVE INCIDENTS PANEL */}
          <NocPanel
            code="INCIDENTS_MONITOR"
            title="Active Incidents"
            status={incidents.length > 0 ? 'danger' : 'default'}
            badge={<StatusIndicator status={incidents.length > 0 ? 'FAILED' : 'RESOLVED'} text={incidents.length > 0 ? 'INVESTIGATE' : '0 ALERTS'} />}
          >
            {incidents.length === 0 ? (
              <div className="text-center py-4 text-[#768a7b] text-xs">
                NO ACTIVE INCIDENTS DETECTED. ALL METRICS STABLE.
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="p-2 bg-[#101411] border border-[#ff3333]/40 rounded-[2px] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#ff3333]">#INC-{inc.id} // {inc.profileName || 'Job Failure'}</span>
                      <StatusIndicator status={inc.status} />
                    </div>
                    <div className="text-[10px] text-[#768a7b]">
                      Target: {inc.hostOverride || inc.serverOverride || 'Profile Default'} — Attempt {inc.attemptNumber || 1}/{inc.maxAttempts || 3}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NocPanel>

          {/* 6. SYSTEM HEALTH PANEL */}
          <NocPanel
            code="HOST_TELEMETRY"
            title="System Health & Resources"
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#768a7b] flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-[#00ff66]" />
                    CPU LOAD
                  </span>
                  <span className="font-bold text-[#00ff66]">{stats?.cpuUsagePct !== undefined ? `${stats.cpuUsagePct}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#00ff66] transition-all duration-300" style={{ width: `${stats?.cpuUsagePct || 0}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#768a7b] flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-[#ffb000]" />
                    MEMORY (RAM)
                  </span>
                  <span className="font-bold text-[#ffb000]">{stats?.memoryUsagePct !== undefined ? `${stats.memoryUsagePct}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#ffb000] transition-all duration-300" style={{ width: `${stats?.memoryUsagePct || 0}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#768a7b] flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-[#00bfff]" />
                    STORAGE
                  </span>
                  <span className="font-bold text-[#00bfff]">{stats?.diskUsagePct !== undefined ? `${stats.diskUsagePct}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#00bfff] transition-all duration-300" style={{ width: `${stats?.diskUsagePct || 0}%` }} />
                </div>
              </div>
            </div>
          </NocPanel>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
