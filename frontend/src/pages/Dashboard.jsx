import { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { NocPanel, MetricReadout, StatusIndicator, RetroButton } from '../components/common';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, jobsRes, agentsRes, profilesRes, incidentsRes] = await Promise.allSettled([
        api.get('/system/stats'),
        api.get('/jobs'),
        api.get('/agents'),
        api.get('/profiles'),
        api.get('/incidents')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value || []);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value || []);
      if (profilesRes.status === 'fulfilled') setProfiles(profilesRes.value || []);
      if (incidentsRes.status === 'fulfilled') setIncidents(incidentsRes.value || []);

      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch NOC dashboard telemetry.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
    const interval = setInterval(() => fetchDashboardData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute real metrics from backend telemetry only
  const activeAgentsCount = agents.filter(a => a.status === 'ONLINE').length;
  const runningJobsCount = jobs.filter(j => j.status === 'RUNNING').length;
  const pendingJobsCount = jobs.filter(j => j.status === 'PENDING').length;

  // Success rate strictly based on completed jobs (SUCCESS, FAILED, TIMEOUT, STALE)
  const finishedJobs = jobs.filter(j => ['SUCCESS', 'FAILED', 'TIMEOUT', 'STALE'].includes(j.status));
  const successJobs = jobs.filter(j => j.status === 'SUCCESS').length;
  const successRate = finishedJobs.length > 0 ? Math.round((successJobs / finishedJobs.length) * 100) : null;

  // Active Incidents derived from incidents telemetry or failed jobs
  const activeIncidents = incidents.length > 0 ? incidents : jobs.filter(j => ['FAILED', 'TIMEOUT', 'STALE'].includes(j.status));

  // Targets derived from actual profile records
  const targets = profiles.map(p => ({
    name: p.name,
    target: p.host || p.server || 'N/A',
    protocol: p.protocol || 'PING'
  })).slice(0, 4);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !stats && jobs.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Interrogating NOC Control Console Telemetry...</span>
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
            <div className="font-bold text-[#d5e3d8] text-sm uppercase tracking-wider font-sans">
              NOC CONTROL CONSOLE // CONSOLE-ID #081
            </div>
            <div className="text-[10px] text-[#768a7b] font-mono">
              ORCHESTRATOR TELEMETRY MONITOR // DISPATCHER STATE: ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator
            status={stats?.overallStatus === 'SUCCESS' ? 'ONLINE' : 'DEGRADED'}
            text={stats?.overallStatus === 'SUCCESS' ? 'NOC ONLINE' : 'DEGRADED'}
          />
          <RetroButton variant="secondary" size="sm" icon={RotateCw} onClick={fetchDashboardData} disabled={loading}>
            Sync Telemetry
          </RetroButton>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold">[ERR.DASHBOARD]</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 2. KPI INSTRUMENTATION STRIP (COMPACT READOUTS - REAL DATA ONLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
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
          subtext={finishedJobs.length > 0 ? `${finishedJobs.length} Completed Runs` : 'No Runs'}
        />

        <MetricReadout
          label="AVERAGE RTT"
          value="N/A"
          status="neutral"
          icon={Terminal}
          subtext="No Stream Metric"
        />

        <MetricReadout
          label="PACKET LOSS"
          value="N/A"
          status="neutral"
          icon={AlertTriangle}
          subtext="No Stream Metric"
        />

        <MetricReadout
          label="ACTIVE INCIDENTS"
          value={incidents.length}
          status={incidents.length > 0 ? 'red' : 'green'}
          icon={AlertTriangle}
          subtext={incidents.length > 0 ? 'Active Alerts' : 'All Clear'}
        />
      </div>

      {/* 3. NETWORK TOPOLOGY VISUAL CENTERPIECE (CONTROLLER → AGENTS → TARGETS) */}
      <NocPanel
        code="TOPOLOGY_MAP"
        title="Distributed Architecture Topology // Controller → Remote Agents → Targets"
        badge={<StatusIndicator status="ACTIVE" text="SUBNET LINK MAP" />}
      >
        <div className="py-4 px-3 font-mono">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 overflow-x-auto">
            
            {/* Column 1: Controller Core Node */}
            <div className="w-full lg:w-60 p-3 bg-[#101411] border border-[#00ff66]/50 rounded-[2px] space-y-2 text-center shrink-0">
              <div className="flex items-center justify-center gap-2 text-[#00ff66] font-bold">
                <Server className="w-4 h-4" />
                <span>[PORTAL CORE]</span>
              </div>
              <div className="text-[11px] text-[#d5e3d8] font-mono">Controller Orchestrator</div>
              <div className="text-[10px] text-[#768a7b]">localhost:8083 (Backend API)</div>
              <div className="pt-1 flex justify-center">
                <StatusIndicator status={stats?.overallStatus === 'SUCCESS' ? 'ONLINE' : 'DEGRADED'} text="PRIMARY CORE" pulse />
              </div>
            </div>

            {/* Link 1: Controller -> Remote Agents */}
            <div className="hidden lg:flex items-center justify-center w-12 text-[#27342a] shrink-0">
              <div className="w-full h-[1px] bg-[#27342a] relative flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#00ff66] absolute -right-2" />
              </div>
            </div>

            {/* Column 2: Remote Agents Node Inventory */}
            <div className="w-full lg:w-72 space-y-2 shrink-0">
              <div className="text-[10px] text-[#768a7b] font-bold uppercase tracking-wider flex items-center justify-between px-1">
                <span>// REMOTE AGENT PROBES</span>
                <span className="text-[#00ff66]">({agents.length} nodes)</span>
              </div>

              {agents.length === 0 ? (
                <div className="p-3 bg-[#101411] border border-[#27342a] text-center text-[#768a7b] text-xs">
                  No remote agents registered. Portal Core executing local workers.
                </div>
              ) : (
                agents.slice(0, 3).map(agent => (
                  <div key={agent.id} className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-bold text-[#d5e3d8] truncate">#{agent.id} — {agent.name}</div>
                      <div className="text-[10px] text-[#768a7b] truncate">{agent.description || 'Subnet Vantage Probe'}</div>
                    </div>
                    <StatusIndicator status={agent.status || 'OFFLINE'} variant="dot" />
                  </div>
                ))
              )}
            </div>

            {/* Link 2: Remote Agents -> Targets */}
            <div className="hidden lg:flex items-center justify-center w-12 text-[#27342a] shrink-0">
              <div className="w-full h-[1px] bg-[#27342a] relative flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#00bfff] absolute -right-2" />
              </div>
            </div>

            {/* Column 3: Diagnostic Targets Node Inventory */}
            <div className="w-full lg:w-72 space-y-2 shrink-0">
              <div className="text-[10px] text-[#768a7b] font-bold uppercase tracking-wider flex items-center justify-between px-1">
                <span>// TARGET DESTINATIONS</span>
                <span className="text-[#00bfff]">({profiles.length} profiles)</span>
              </div>

              {targets.length === 0 ? (
                <div className="p-3 bg-[#101411] border border-[#27342a] text-center text-[#768a7b] text-xs">
                  No test profiles configured. Create profiles to set network targets.
                </div>
              ) : (
                targets.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-bold text-[#00bfff] truncate">{t.target}</div>
                      <div className="text-[10px] text-[#768a7b] truncate">{t.name}</div>
                    </div>
                    <span className="text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 border border-[#00ff66]/30 rounded-[1px] font-bold shrink-0">
                      [{t.protocol}]
                    </span>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </NocPanel>

      {/* LOWER PANELS GRID: 4. Recent Jobs | 5. Active Incidents | 6. System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-mono">
        
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
              <table className="custom-table w-full text-left">
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
                        <td className="text-[#00bfff]">{j.effectiveHost || j.effectiveServer || j.hostOverride || j.serverOverride || 'Default'}</td>
                        <td><StatusIndicator status={j.status} variant="dot" /></td>
                        <td className="text-[#768a7b]">{j.agentName ? `Agent: ${j.agentName}` : (j.requestedByUsername || 'Core')}</td>
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
            status={activeIncidents.length > 0 ? 'danger' : 'default'}
            badge={<StatusIndicator status={activeIncidents.length > 0 ? 'FAILED' : 'RESOLVED'} text={activeIncidents.length > 0 ? `${activeIncidents.length} ALERTS` : '0 ALERTS'} />}
          >
            {activeIncidents.length === 0 ? (
              <div className="text-center py-4 text-[#768a7b] text-xs">
                NO ACTIVE INCIDENTS DETECTED. ALL METRICS STABLE.
              </div>
            ) : (
              <div className="space-y-2">
                {activeIncidents.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="p-2.5 bg-[#101411] border border-[#ff3333]/40 rounded-[2px] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#ff3333]">#INC-{inc.id} // {inc.profileName || 'Job Failure'}</span>
                      <StatusIndicator status={inc.status} variant="dot" />
                    </div>
                    <div className="text-[10px] text-[#768a7b]">
                      Target: {inc.effectiveHost || inc.effectiveServer || inc.hostOverride || inc.serverOverride || 'Profile Default'} — Attempt {inc.attemptNumber || 1}/{inc.maxAttempts || 3}
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
                  <span className="font-bold text-[#00ff66]">
                    {stats?.cpuUsagePct !== undefined && stats?.cpuUsagePct !== null ? `${stats.cpuUsagePct}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div
                    className="h-full bg-[#00ff66] transition-all duration-300"
                    style={{ width: `${stats?.cpuUsagePct || 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#768a7b] flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-[#ffb000]" />
                    MEMORY (RAM)
                  </span>
                  <span className="font-bold text-[#ffb000]">
                    {stats?.memoryUsagePct !== undefined && stats?.memoryUsagePct !== null ? `${stats.memoryUsagePct}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div
                    className="h-full bg-[#ffb000] transition-all duration-300"
                    style={{ width: `${stats?.memoryUsagePct || 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#768a7b] flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-[#00bfff]" />
                    STORAGE
                  </span>
                  <span className="font-bold text-[#00bfff]">
                    {stats?.diskUsagePct !== undefined && stats?.diskUsagePct !== null ? `${stats.diskUsagePct}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-[#101411] h-1.5 border border-[#27342a] rounded-[1px] overflow-hidden">
                  <div
                    className="h-full bg-[#00bfff] transition-all duration-300"
                    style={{ width: `${stats?.diskUsagePct || 0}%` }}
                  />
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
