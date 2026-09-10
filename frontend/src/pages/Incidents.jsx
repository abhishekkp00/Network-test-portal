import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import {
  AlertTriangle,
  RotateCw,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Shield,
  Activity,
  X,
  Info
} from 'lucide-react';
import {
  NocPanel,
  RetroButton,
  StatusIndicator,
  SectionHeader,
  MetricReadout
} from '../components/common';

/**
 * Narrow Severity Badge Primitive (Restrained colors, no giant red cards)
 */
const SeverityBadge = ({ severity }) => {
  const norm = (severity || 'WARNING').toString().toUpperCase();

  const config = {
    INFO: { label: 'INFO', color: 'text-[#00bfff]', bg: 'bg-[#00bfff]/10', border: 'border-[#00bfff]/30', dot: 'bg-[#00bfff]' },
    WARNING: { label: 'WARNING', color: 'text-[#ffb000]', bg: 'bg-[#ffb000]/10', border: 'border-[#ffb000]/30', dot: 'bg-[#ffb000]' },
    HIGH: { label: 'HIGH', color: 'text-[#ff6600]', bg: 'bg-[#ff6600]/10', border: 'border-[#ff6600]/30', dot: 'bg-[#ff6600]' },
    CRITICAL: { label: 'CRITICAL', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]/10', border: 'border-[#ff3333]/40', dot: 'bg-[#ff3333]' },
  };

  const style = config[norm] || config.WARNING;

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2 py-0.5 border ${style.border} ${style.bg} ${style.color} rounded-[1px] uppercase tracking-wider select-none`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  );
};

export const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');

  // Detail Modal State
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchIncidents = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError('');
    try {
      const data = await api.get('/incidents');
      // Sort desc by ID
      const sorted = (data || []).sort((a, b) => b.id - a.id);
      setIncidents(sorted);
    } catch (err) {
      setError(err.message || 'Failed to retrieve network incident telemetry.');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const data = await api.get('/incidents');
        if (!isMounted) return;
        const sorted = (data || []).sort((a, b) => b.id - a.id);
        setIncidents(sorted);
        setError('');
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to retrieve network incident telemetry.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();
    const interval = setInterval(() => {
      fetchIncidents(false);
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const deriveIncidentType = (inc) => {
    const summary = (inc.summary || '').toLowerCase();
    if (summary.includes('latency')) return 'LATENCY BREACH';
    if (summary.includes('packet loss') || summary.includes('loss')) return 'PACKET LOSS';
    if (summary.includes('timeout')) return 'TIMEOUT DISRUPTION';
    if (summary.includes('stale') || summary.includes('offline')) return 'WORKER STALE';
    return 'NETWORK FAULT';
  };

  // Filter & Sort Logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const idMatch = inc.id?.toString().includes(query);
        const nameMatch = (inc.profileName || '').toLowerCase().includes(query);
        const summaryMatch = (inc.summary || '').toLowerCase().includes(query);
        const typeMatch = deriveIncidentType(inc).toLowerCase().includes(query);
        if (!idMatch && !nameMatch && !summaryMatch && !typeMatch) return false;
      }

      // Severity Filter
      if (severityFilter !== 'ALL') {
        const sev = (inc.severity || 'WARNING').toUpperCase();
        if (sev !== severityFilter) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        const stat = (inc.status || 'OPEN').toUpperCase();
        if (stat !== statusFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'id':
          valA = a.id; valB = b.id;
          break;
        case 'severity':
          valA = (a.severity || '').toLowerCase(); valB = (b.severity || '').toLowerCase();
          break;
        case 'target':
          valA = (a.profileName || '').toLowerCase(); valB = (b.profileName || '').toLowerCase();
          break;
        case 'type':
          valA = deriveIncidentType(a); valB = deriveIncidentType(b);
          break;
        case 'started':
          valA = new Date(a.firstSeenAt || 0).getTime(); valB = new Date(b.firstSeenAt || 0).getTime();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase(); valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = a.id; valB = b.id;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incidents, searchTerm, severityFilter, statusFilter, sortField, sortDirection]);

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
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setSortField('id');
    setSortDirection('desc');
  };

  // Metrics
  const totalCount = incidents.length;
  const activeCount = incidents.filter(i => ['OPEN', 'ONGOING'].includes(i.status)).length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  if (loading && incidents.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Interrogating Network Incident Management Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono text-xs">
      
      {/* 1. PAGE HEADER */}
      <SectionHeader
        code="SYS_INCIDENTS"
        title="Network Incident Management Console"
        subtitle="Operational alert deduplication, anomaly detection, and resolution logs"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={() => fetchIncidents(true)} disabled={loading}>
            Sync Alerts
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">[ERR.INCIDENTS]</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#ff3333] hover:text-[#d5e3d8]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPI INSTRUMENTATION STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricReadout label="TOTAL INCIDENTS" value={totalCount} status="neutral" icon={AlertTriangle} subtext="Aggregated log" />
        <MetricReadout label="ACTIVE ALERTS" value={activeCount} status={activeCount > 0 ? 'red' : 'green'} icon={Activity} subtext={activeCount > 0 ? "Under investigation" : "All clear"} />
        <MetricReadout label="CRITICAL BREACHES" value={criticalCount} status={criticalCount > 0 ? 'red' : 'neutral'} icon={Shield} subtext="High impact faults" />
        <MetricReadout label="RESOLVED" value={resolvedCount} status="green" icon={CheckCircle2} subtext="Closed incidents" />
      </div>

      {/* 3. DENSE CONTROL BAR (SEARCH, FILTERS, SORT) */}
      <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#768a7b]" />
          <input
            type="text"
            placeholder="Search by Incident ID, Target, Summary, Type..."
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
            <span className="text-[10px] text-[#768a7b] font-bold">SEVERITY:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs text-[#ffb000] focus:outline-none cursor-pointer font-mono font-bold"
            >
              <option value="ALL" className="bg-[#101411] text-[#d5e3d8]">ALL SEVERITIES</option>
              <option value="INFO" className="bg-[#101411] text-[#00bfff]">INFO</option>
              <option value="WARNING" className="bg-[#101411] text-[#ffb000]">WARNING</option>
              <option value="HIGH" className="bg-[#101411] text-[#ff6600]">HIGH</option>
              <option value="CRITICAL" className="bg-[#101411] text-[#ff3333]">CRITICAL</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
            <span className="text-[10px] text-[#768a7b] font-bold">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#00ff66] focus:outline-none cursor-pointer font-mono font-bold"
            >
              <option value="ALL" className="bg-[#101411] text-[#d5e3d8]">ALL STATUSES</option>
              <option value="OPEN" className="bg-[#101411] text-[#ff3333]">OPEN</option>
              <option value="ONGOING" className="bg-[#101411] text-[#00bfff]">ONGOING</option>
              <option value="RESOLVED" className="bg-[#101411] text-[#00ff66]">RESOLVED</option>
            </select>
          </div>

          {(searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <RetroButton variant="danger" size="sm" onClick={clearFilters}>
              Reset Filters
            </RetroButton>
          )}

        </div>
      </div>

      {/* 4. DENSE TECHNICAL INCIDENT MANAGEMENT CONSOLE TABLE */}
      <NocPanel
        code="ALERT_LOG"
        title={`Incident Registry Stream (${filteredIncidents.length} records)`}
        badge={<StatusIndicator status="ACTIVE" text="OPERATIONAL MONITOR" />}
        noPadding
      >
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="custom-table w-full text-left">
            <thead>
              <tr className="select-none">
                <th onClick={() => toggleSort('id')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>INCIDENT ID</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('severity')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>SEVERITY</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('target')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>TARGET</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('type')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>TYPE</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('started')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>STARTED</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer hover:text-[#00ff66]">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <ArrowUpDown className="w-3 h-3 text-[#768a7b]" />
                  </div>
                </th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-[#768a7b]">
                    NO NETWORK INCIDENTS MATCH CURRENT OPERATIONAL FILTERS.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const targetName = inc.profileName || `Profile #${inc.profileId || 'N/A'}`;
                  const incidentType = deriveIncidentType(inc);
                  const incidentStatus = (inc.status || 'OPEN').toUpperCase();

                  return (
                    <tr key={inc.id} className="hover:bg-[#151c17] transition-colors">
                      <td className="font-bold text-[#ff3333] font-mono">
                        #INC-{inc.id}
                      </td>
                      <td>
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="font-semibold text-[#d5e3d8]">
                        {targetName}
                      </td>
                      <td className="font-mono text-xs text-[#00bfff]">
                        [{incidentType}]
                      </td>
                      <td className="text-[11px] text-[#768a7b] font-mono whitespace-nowrap">
                        {formatDateTime(inc.firstSeenAt)}
                      </td>
                      <td>
                        <StatusIndicator status={incidentStatus} variant="dot" />
                      </td>
                      <td className="text-right">
                        <RetroButton variant="primary" size="sm" icon={Info} onClick={() => setSelectedIncident(inc)}>
                          Inspect
                        </RetroButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NocPanel>

      {/* 5. COMPACT INCIDENT DETAIL SPECIFICATION MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <NocPanel
              code={`INCIDENT_TELEMETRY // #INC-${selectedIncident.id}`}
              title={`Incident Operational Inspection // #INC-${selectedIncident.id}`}
              badge={<StatusIndicator status={selectedIncident.status} variant="dot" />}
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setSelectedIncident(null)}>
                  Close Console
                </RetroButton>
              }
            >
              <div className="space-y-4 font-mono text-xs">
                
                {/* Incident Technical Readout Grid */}
                <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// INCIDENT ID</span>
                    <span className="font-bold text-[#ff3333]">#INC-{selectedIncident.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// SEVERITY</span>
                    <SeverityBadge severity={selectedIncident.severity} />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// STATUS</span>
                    <StatusIndicator status={selectedIncident.status} variant="dot" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// TARGET / PROFILE</span>
                    <span className="font-bold text-[#d5e3d8] truncate block">
                      {selectedIncident.profileName || `Profile #${selectedIncident.profileId}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// TYPE</span>
                    <span className="font-bold text-[#00bfff]">{deriveIncidentType(selectedIncident)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// OCCURRENCE COUNT</span>
                    <span className="font-bold text-[#00ff66]">{selectedIncident.occurrenceCount || 1} Events</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// STARTED (FIRST SEEN)</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(selectedIncident.firstSeenAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// LAST SEEN</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(selectedIncident.lastSeenAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// RESOLVED AT</span>
                    <span className="text-[#d5e3d8]">{selectedIncident.resolvedAt ? formatDateTime(selectedIncident.resolvedAt) : 'Unresolved (Active)'}</span>
                  </div>
                </div>

                {/* Summary & Fault Details */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#768a7b] font-bold uppercase">// FAULT SUMMARY & BREACH TELEMETRY</div>
                  <div className="p-3 bg-[#080b09] border border-[#27342a] rounded-[2px] text-[#d5e3d8] leading-relaxed">
                    {selectedIncident.summary || 'Metric threshold violation detected during diagnostic probe execution.'}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <RetroButton variant="primary" onClick={() => setSelectedIncident(null)}>
                    Close Telemetry
                  </RetroButton>
                </div>

              </div>
            </NocPanel>
          </div>
        </div>
      )}

    </div>
  );
};

export default Incidents;
