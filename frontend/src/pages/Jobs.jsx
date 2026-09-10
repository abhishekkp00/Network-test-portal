import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../utils/api';
import {
  RotateCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  X,
  Activity,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Radio,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import {
  NocPanel,
  RetroButton,
  StatusIndicator,
  SectionHeader,
  MetricReadout,
  TerminalOutput
} from '../components/common';

export const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering, Search, Sorting, Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Job Detail Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState('');

  // Polling reference
  const pollingIntervalRef = useRef(null);

  const fetchJobsAndAgents = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [jobsRes, agentsRes] = await Promise.allSettled([
        api.get('/jobs'),
        api.get('/agents')
      ]);

      if (jobsRes.status === 'fulfilled') {
        const sortedJobs = (jobsRes.value || []).sort((a, b) => b.id - a.id);
        setJobs(sortedJobs);
        setError('');
      } else {
        throw new Error(jobsRes.reason?.message || 'Failed to fetch diagnostic jobs queue.');
      }

      if (agentsRes.status === 'fulfilled') {
        setAgentsList(agentsRes.value || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch diagnostic execution queue.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndAgents();
    return () => stopPolling();
  }, []);

  // Set up auto polling when PENDING or RUNNING jobs are present
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === 'PENDING' || j.status === 'RUNNING');
    if (hasActiveJobs) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [jobs]);

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      fetchJobsAndAgents(false);
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const viewJobDetails = async (job) => {
    setSelectedJob(job);
    setResult(null);
    setResultLoading(true);
    setResultError('');
    try {
      const data = await api.get(`/jobs/${job.id}/result`);
      setResult(data);
    } catch (err) {
      setResultError(err.message || 'Failed to fetch job execution result telemetry.');
    } finally {
      setResultLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedJob(null);
    setResult(null);
    setResultError('');
  };

  // Helper formatting functions
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const d = new Date(dateTimeStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const calculateDuration = (startedAt, finishedAt, status) => {
    if (status === 'PENDING') return 'pending';
    if (status === 'RUNNING') return 'running...';
    if (!startedAt) return 'N/A';

    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    if (isNaN(start) || isNaN(end)) return 'N/A';

    const diffSec = Math.max(0, (end - start) / 1000).toFixed(1);
    return `${diffSec}s`;
  };

  // Extract unique protocols & agents for filter dropdowns
  const availableProtocols = useMemo(() => {
    const set = new Set();
    jobs.forEach(j => {
      const proto = j.effectiveProtocol || j.protocolOverride;
      if (proto) set.add(proto.toUpperCase());
    });
    return Array.from(set).sort();
  }, [jobs]);

  const availableAgents = useMemo(() => {
    const set = new Set();
    agentsList.forEach(a => { if (a.name) set.add(a.name); });
    jobs.forEach(j => { if (j.agentName) set.add(j.agentName); });
    return Array.from(set).sort();
  }, [jobs, agentsList]);

  // Filter & Sort Logic
  const filteredAndSortedJobs = useMemo(() => {
    return jobs.filter(job => {
      // 1. Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const idMatch = job.id?.toString().includes(query);
        const profileMatch = (job.profileName || '').toLowerCase().includes(query);
        const targetMatch = (job.effectiveHost || job.effectiveServer || job.hostOverride || job.serverOverride || '').toLowerCase().includes(query);
        const agentMatch = (job.agentName || job.requestedByUsername || '').toLowerCase().includes(query);
        const protoMatch = (job.effectiveProtocol || job.protocolOverride || '').toLowerCase().includes(query);
        if (!idMatch && !profileMatch && !targetMatch && !agentMatch && !protoMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'FAILED' && !['FAILED', 'STALE'].includes(job.status)) return false;
        if (statusFilter !== 'FAILED' && job.status !== statusFilter) return false;
      }

      // 3. Protocol Filter
      if (protocolFilter !== 'ALL') {
        const jobProto = (job.effectiveProtocol || job.protocolOverride || '').toUpperCase();
        if (jobProto !== protocolFilter) return false;
      }

      // 4. Agent Filter
      if (agentFilter !== 'ALL') {
        if (agentFilter === 'Core Orchestrator' && job.agentName) return false;
        if (agentFilter !== 'Core Orchestrator' && job.agentName !== agentFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        case 'profile':
          valA = (a.profileName || '').toLowerCase();
          valB = (b.profileName || '').toLowerCase();
          break;
        case 'target':
          valA = (a.effectiveHost || a.effectiveServer || a.hostOverride || a.serverOverride || '').toLowerCase();
          valB = (b.effectiveHost || b.effectiveServer || b.hostOverride || b.serverOverride || '').toLowerCase();
          break;
        case 'agent':
          valA = (a.agentName || a.requestedByUsername || 'Core').toLowerCase();
          valB = (b.agentName || b.requestedByUsername || 'Core').toLowerCase();
          break;
        case 'protocol':
          valA = (a.effectiveProtocol || a.protocolOverride || '').toLowerCase();
          valB = (b.effectiveProtocol || b.protocolOverride || '').toLowerCase();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        case 'created':
          valA = new Date(a.createdAt || 0).getTime();
          valB = new Date(b.createdAt || 0).getTime();
          break;
        case 'duration':
          const durA = a.startedAt ? (a.finishedAt ? new Date(a.finishedAt).getTime() - new Date(a.startedAt).getTime() : Date.now() - new Date(a.startedAt).getTime()) : 0;
          const durB = b.startedAt ? (b.finishedAt ? new Date(b.finishedAt).getTime() - new Date(b.startedAt).getTime() : Date.now() - new Date(b.startedAt).getTime()) : 0;
          valA = durA;
          valB = durB;
          break;
        default:
          valA = a.id;
          valB = b.id;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [jobs, searchTerm, statusFilter, protocolFilter, agentFilter, sortField, sortDirection]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, protocolFilter, agentFilter, pageSize]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedJobs.slice(start, start + pageSize);
  }, [filteredAndSortedJobs, currentPage, pageSize]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setProtocolFilter('ALL');
    setAgentFilter('ALL');
    setSortField('id');
    setSortDirection('desc');
  };

  // Metric counts
  const totalJobsCount = jobs.length;
  const runningCount = jobs.filter(j => j.status === 'RUNNING').length;
  const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
  const successCount = jobs.filter(j => j.status === 'SUCCESS').length;
  const failedCount = jobs.filter(j => ['FAILED', 'TIMEOUT', 'STALE'].includes(j.status)).length;

  if (loading && jobs.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Initializing Diagnostic Execution Console Queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono text-xs">
      
      {/* 1. PAGE HEADER */}
      <SectionHeader
        code="SYS_JOB_QUEUE"
        title="Diagnostic Job Execution Console"
        subtitle="Network probing queue, worker dispatchers, and telemetry stream"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={() => fetchJobsAndAgents(true)} disabled={loading}>
            Sync Queue
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">[ERR.TELEMETRY]</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#ff3333] hover:text-[#d5e3d8]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPI METRIC INSTRUMENTATION STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <MetricReadout label="TOTAL JOBS" value={totalJobsCount} status="neutral" icon={Terminal} subtext="Queue total" />
        <MetricReadout label="RUNNING" value={runningCount} status="cyan" icon={Activity} subtext="Active probes" />
        <MetricReadout label="PENDING" value={pendingCount} status="amber" icon={Clock} subtext="Dispatched queue" />
        <MetricReadout label="SUCCESS" value={successCount} status="green" icon={CheckCircle2} subtext="Clean completions" />
        <MetricReadout label="FAILED / TIMEOUT" value={failedCount} status="red" icon={AlertTriangle} subtext="Telemetric faults" />
      </div>

      {/* 3. DENSE CONTROL BAR (SEARCH, FILTERS, SORT) */}
      <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#768a7b]" />
            <input
              type="text"
              placeholder="Search by Job ID, Profile, Target, Agent, Protocol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#080b09] border border-[#27342a] rounded-[2px] pl-8 pr-3 py-1.5 text-xs text-[#d5e3d8] placeholder-[#768a7b] focus:outline-none focus:border-[#00ff66] font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#768a7b] hover:text-[#d5e3d8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
              <span className="text-[10px] text-[#768a7b] font-bold">STATUS:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-[#00ff66] focus:outline-none cursor-pointer font-mono font-bold"
              >
                <option value="ALL" className="bg-[#101411] text-[#d5e3d8]">ALL</option>
                <option value="PENDING" className="bg-[#101411] text-[#ffb000]">PENDING</option>
                <option value="RUNNING" className="bg-[#101411] text-[#00bfff]">RUNNING</option>
                <option value="SUCCESS" className="bg-[#101411] text-[#00ff66]">SUCCESS</option>
                <option value="FAILED" className="bg-[#101411] text-[#ff3333]">FAILED</option>
                <option value="TIMEOUT" className="bg-[#101411] text-[#ff3333]">TIMEOUT</option>
              </select>
            </div>

            {/* Protocol Filter */}
            <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
              <span className="text-[10px] text-[#768a7b] font-bold">PROTO:</span>
              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="bg-transparent text-xs text-[#00bfff] focus:outline-none cursor-pointer font-mono font-bold"
              >
                <option value="ALL" className="bg-[#101411] text-[#d5e3d8]">ALL</option>
                {availableProtocols.map(proto => (
                  <option key={proto} value={proto} className="bg-[#101411] text-[#00bfff]">{proto}</option>
                ))}
              </select>
            </div>

            {/* Agent Filter */}
            <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
              <span className="text-[10px] text-[#768a7b] font-bold">AGENT:</span>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-transparent text-xs text-[#d5e3d8] focus:outline-none cursor-pointer font-mono font-semibold"
              >
                <option value="ALL" className="bg-[#101411]">ALL AGENTS</option>
                <option value="Core Orchestrator" className="bg-[#101411]">Core Orchestrator</option>
                {availableAgents.map(ag => (
                  <option key={ag} value={ag} className="bg-[#101411]">{ag}</option>
                ))}
              </select>
            </div>

            {(searchTerm || statusFilter !== 'ALL' || protocolFilter !== 'ALL' || agentFilter !== 'ALL') && (
              <RetroButton variant="danger" size="sm" onClick={clearFilters}>
                Reset
              </RetroButton>
            )}

          </div>
        </div>
      </div>

      {/* 4. DENSE TECHNICAL JOBS TABLE */}
      <NocPanel
        code="EXECUTION_TABLE"
        title={`Diagnostic Records (${filteredAndSortedJobs.length} match)`}
        badge={
          <span className="text-[10px] text-[#768a7b]">
            Showing {filteredAndSortedJobs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredAndSortedJobs.length)} of {filteredAndSortedJobs.length}
          </span>
        }
        noPadding
      >
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="custom-table w-full text-left">
            <thead>
              <tr className="select-none">
                <th onClick={() => toggleSort('id')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>JOB ID</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('profile')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>PROFILE</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('target')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>TARGET</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('agent')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>AGENT</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('protocol')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>PROTOCOL</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th>ATTEMPT</th>
                <th onClick={() => toggleSort('created')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>CREATED</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('duration')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>DURATION</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-[#768a7b]">
                    NO DIAGNOSTIC JOBS MATCH CURRENT CONSOLE FILTERS.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => {
                  const targetHost = job.effectiveHost || job.effectiveServer || job.hostOverride || job.serverOverride || 'Default';
                  const agentDisplayName = job.agentName ? job.agentName : (job.requestedByUsername ? `User:${job.requestedByUsername}` : 'Core System');
                  const protocolName = (job.effectiveProtocol || job.protocolOverride || 'PING').toUpperCase();
                  const durationStr = calculateDuration(job.startedAt, job.finishedAt, job.status);

                  return (
                    <tr key={job.id} className="hover:bg-[#151c17] transition-colors">
                      <td className="font-bold text-[#00ff66]">
                        #{job.id}
                      </td>
                      <td className="font-semibold text-[#d5e3d8]">
                        {job.profileName || `Profile #${job.profileId}`}
                      </td>
                      <td className="font-mono text-[#00bfff]">
                        {targetHost}
                      </td>
                      <td className="text-[#768a7b]">
                        {agentDisplayName}
                      </td>
                      <td>
                        <span className="text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 border border-[#00ff66]/30 rounded-[1px] font-bold">
                          {protocolName}
                        </span>
                      </td>
                      <td>
                        <StatusIndicator status={job.status} variant="dot" />
                      </td>
                      <td className="font-mono text-[#768a7b]">
                        {job.attemptNumber || 1} / {job.maxAttempts || 3}
                      </td>
                      <td className="text-[11px] text-[#768a7b]">
                        {formatDateTime(job.createdAt)}
                      </td>
                      <td className="font-mono text-[#d5e3d8]">
                        {durationStr}
                      </td>
                      <td className="text-right">
                        <RetroButton variant="primary" size="sm" onClick={() => viewJobDetails(job)}>
                          Telemetry
                        </RetroButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="bg-[#101411] px-4 py-2 border-t border-[#27342a] flex flex-wrap items-center justify-between gap-3 text-xs text-[#768a7b]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#080b09] border border-[#27342a] text-[#d5e3d8] rounded-[2px] px-2 py-0.5 focus:outline-none font-mono"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page <strong className="text-[#d5e3d8]">{currentPage}</strong> of <strong className="text-[#d5e3d8]">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <RetroButton
                variant="ghost"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </RetroButton>
              <RetroButton
                variant="ghost"
                size="sm"
                icon={ChevronRight}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </RetroButton>
            </div>
          </div>
        </div>
      </NocPanel>

      {/* 5. COMPACT JOB-DETAIL TELEMETRY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <NocPanel
              code={`JOB_CONSOLE // #${selectedJob.id}`}
              title={`Diagnostic Detailed Execution View // #${selectedJob.id}`}
              badge={<StatusIndicator status={selectedJob.status} variant="dot" />}
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={closeDetailModal}>
                  Close Console
                </RetroButton>
              }
            >
              <div className="space-y-4">
                
                {/* Job Metadata Grid */}
                <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// JOB ID</span>
                    <span className="font-bold text-[#00ff66]">#{selectedJob.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// TARGET</span>
                    <span className="font-bold text-[#00bfff] truncate block">
                      {selectedJob.effectiveHost || selectedJob.effectiveServer || selectedJob.hostOverride || selectedJob.serverOverride || 'Default'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// PROTOCOL</span>
                    <span className="font-bold text-[#00ff66]">
                      {(selectedJob.effectiveProtocol || selectedJob.protocolOverride || 'PING').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// AGENT</span>
                    <span className="font-bold text-[#d5e3d8] truncate block">
                      {selectedJob.agentName ? selectedJob.agentName : (selectedJob.requestedByUsername || 'Core System')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// ATTEMPT</span>
                    <span className="font-bold text-[#d5e3d8]">
                      {selectedJob.attemptNumber || 1} / {selectedJob.maxAttempts || 3}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// STATUS</span>
                    <StatusIndicator status={selectedJob.status} variant="dot" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// START TIME</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(selectedJob.startedAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// END TIME</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(selectedJob.finishedAt)}</span>
                  </div>
                </div>

                {/* Telemetry Output Metrics Strip */}
                {resultLoading ? (
                  <div className="py-8 text-center text-[#768a7b] font-mono text-xs">
                    [SYS.INFO] Fetching execution telemetry metrics...
                  </div>
                ) : resultError ? (
                  <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] font-mono text-xs">
                    [ERR.TELEMETRY] {resultError}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                      
                      {/* Packet Loss */}
                      <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px]">
                        <div className="text-[10px] text-[#768a7b] font-bold uppercase">PACKET LOSS</div>
                        <div className={`text-base font-bold mt-1 ${
                          result?.packetLossPct > 0 ? 'text-[#ff3333]' : 'text-[#00ff66]'
                        }`}>
                          {result?.packetLossPct !== null && result?.packetLossPct !== undefined
                            ? `${result.packetLossPct}%`
                            : 'N/A'}
                        </div>
                      </div>

                      {/* RTT MIN / AVG / MAX */}
                      <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px]">
                        <div className="text-[10px] text-[#768a7b] font-bold uppercase">RTT (MIN/AVG/MAX)</div>
                        <div className="text-xs font-bold text-[#00ff66] mt-1">
                          {result?.rttAvgMs !== null && result?.rttAvgMs !== undefined
                            ? `${result.rttMinMs ?? '-'}/${result.rttAvgMs}/${result.rttMaxMs ?? '-'} ms`
                            : 'N/A'}
                        </div>
                      </div>

                      {/* JITTER */}
                      <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px]">
                        <div className="text-[10px] text-[#768a7b] font-bold uppercase">JITTER</div>
                        <div className="text-base font-bold text-[#ffb000] mt-1">
                          {result?.jitterMs !== null && result?.jitterMs !== undefined
                            ? `${result.jitterMs} ms`
                            : 'N/A'}
                        </div>
                      </div>

                      {/* THROUGHPUT */}
                      <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px]">
                        <div className="text-[10px] text-[#768a7b] font-bold uppercase">THROUGHPUT</div>
                        <div className="text-base font-bold text-[#00bfff] mt-1">
                          {result?.throughputMbps !== null && result?.throughputMbps !== undefined
                            ? `${result.throughputMbps} Mbps`
                            : 'N/A'}
                        </div>
                      </div>

                      {/* PARSED STATUS / EXIT CODE */}
                      <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px]">
                        <div className="text-[10px] text-[#768a7b] font-bold uppercase">EXIT CODE</div>
                        <div className="text-base font-bold text-[#d5e3d8] mt-1">
                          {result?.exitCode !== undefined ? result.exitCode : (selectedJob.status === 'SUCCESS' ? 0 : 'N/A')}
                        </div>
                      </div>

                    </div>

                    {/* 6. RAW TERMINAL OUTPUT COMPONENT */}
                    <TerminalOutput
                      output={result?.rawOutput || result?.errorMessage}
                      exitCode={result?.exitCode}
                      title={`EXECUTION CONSOLE LOG // JOB #${selectedJob.id}`}
                      maxHeight="max-h-80"
                    />
                  </div>
                )}

              </div>
            </NocPanel>
          </div>
        </div>
      )}

    </div>
  );
};

export default Jobs;
