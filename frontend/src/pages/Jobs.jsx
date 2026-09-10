import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { RotateCw, Terminal, CheckCircle2, AlertTriangle, X, Activity, Server } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator, SectionHeader, MetricReadout } from '../components/common';

export const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Results view state
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState('');

  // Polling ref
  const pollingIntervalRef = useRef(null);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.get('/jobs');
      // Sort jobs by ID desc
      const sortedJobs = data.sort((a, b) => b.id - a.id);
      setJobs(sortedJobs);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch test jobs.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
    return () => stopPolling();
  }, []);

  // Set up polling if there are PENDING or RUNNING jobs
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
      fetchJobs(false);
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const viewResult = async (jobId) => {
    setSelectedJobId(jobId);
    setResult(null);
    setResultLoading(true);
    setResultError('');
    try {
      const data = await api.get(`/jobs/${jobId}/result`);
      setResult(data);
    } catch (err) {
      setResultError(err.message || 'Failed to fetch execution telemetry.');
    } finally {
      setResultLoading(false);
    }
  };

  const closeResultModal = () => {
    setSelectedJobId(null);
    setResult(null);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const d = new Date(dateTimeStr);
    return d.toLocaleString();
  };

  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(j => j.status === 'RUNNING').length;
  const pendingJobs = jobs.filter(j => j.status === 'PENDING').length;
  const successJobs = jobs.filter(j => j.status === 'SUCCESS').length;
  const failedJobs = jobs.filter(j => j.status === 'FAILED' || j.status === 'TIMEOUT' || j.status === 'STALE').length;

  if (loading && jobs.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Polling active diagnostic jobs...</span>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <SectionHeader
        code="SYS_JOB_QUEUE"
        title="Diagnostic Job Execution Queue"
        subtitle="Real-time execution status and telemetry report logs"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={() => fetchJobs(true)} disabled={loading}>
            Refresh Queue
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR]</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Readout Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricReadout label="TOTAL JOBS" value={totalJobs} status="neutral" icon={Terminal} />
        <MetricReadout label="RUNNING" value={runningJobs} status="cyan" icon={Activity} />
        <MetricReadout label="PENDING" value={pendingJobs} status="amber" icon={RotateCw} />
        <MetricReadout label="SUCCESS" value={successJobs} status="green" icon={CheckCircle2} />
        <MetricReadout label="FAILED/STALE" value={failedJobs} status="red" icon={AlertTriangle} />
      </div>

      {/* Jobs Table */}
      <NocPanel code="QUEUE_LOGS" title="Job Execution Records" noPadding>
        <div className="table-container border-0 rounded-none">
          <table className="custom-table">
            <thead>
              <tr>
                <th>JOB ID</th>
                <th>PROFILE / PROTOCOL</th>
                <th>EXECUTION TARGET</th>
                <th>STATUS</th>
                <th>ATTEMPTS</th>
                <th>EXECUTED BY</th>
                <th>TIMESTAMP</th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-[#768a7b]">
                    No diagnostic jobs found in queue. Execute a profile to start.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="font-mono text-[#00ff66] font-bold">
                      #{job.id}
                    </td>
                    <td>
                      <div className="font-semibold text-[#d5e3d8]">
                        {job.profileName || `Profile #${job.profileId}`}
                      </div>
                      <div className="text-[10px] text-[#768a7b]">
                        [{job.protocolOverride || 'DEFAULT'}]
                      </div>
                    </td>
                    <td className="font-mono text-[#00bfff]">
                      {job.hostOverride || job.serverOverride || 'Profile Default'}
                    </td>
                    <td>
                      <StatusIndicator status={job.status} />
                    </td>
                    <td className="font-mono text-[#768a7b]">
                      {job.attemptNumber || 1} / {job.maxAttempts || 3}
                    </td>
                    <td className="text-[#768a7b]">
                      {job.agentName ? `Agent: ${job.agentName}` : job.executedByUsername || 'Core System'}
                    </td>
                    <td className="text-[11px] text-[#768a7b]">
                      {formatDateTime(job.createdAt)}
                    </td>
                    <td className="text-right">
                      {['SUCCESS', 'FAILED', 'TIMEOUT', 'STALE'].includes(job.status) ? (
                        <RetroButton variant="primary" size="sm" onClick={() => viewResult(job.id)}>
                          Telemetry
                        </RetroButton>
                      ) : (
                        <span className="text-[10px] text-[#768a7b] italic">Executing...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NocPanel>

      {/* TELEMETRY RESULTS MODAL */}
      {selectedJobId && (
        <div className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <NocPanel
              code={`JOB_TELEMETRY // #${selectedJobId}`}
              title="Execution Output Telemetry"
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={closeResultModal}>
                  Close
                </RetroButton>
              }
            >
              {resultLoading && (
                <div className="py-12 text-center font-mono text-xs text-[#768a7b]">
                  [SYS.INFO] Fetching job result telemetry...
                </div>
              )}

              {resultError && (
                <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333]">
                  [ERR] {resultError}
                </div>
              )}

              {!resultLoading && !resultError && !result && (
                <div className="py-12 text-center font-mono text-xs text-[#768a7b]">
                  No telemetry output recorded for this job run.
                </div>
              )}

              {!resultLoading && result && (
                <div className="space-y-4 font-mono text-xs">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-[#101411] border border-[#27342a] rounded-[2px]">
                      <div className="text-[10px] text-[#768a7b]">RTT AVG</div>
                      <div className="text-sm font-bold text-[#00ff66]">
                        {result.rttAvgMs !== null && result.rttAvgMs !== undefined ? `${result.rttAvgMs} ms` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-[#101411] border border-[#27342a] rounded-[2px]">
                      <div className="text-[10px] text-[#768a7b]">PACKET LOSS</div>
                      <div className="text-sm font-bold text-[#ff3333]">
                        {result.packetLossPct !== null && result.packetLossPct !== undefined ? `${result.packetLossPct}%` : '0%'}
                      </div>
                    </div>
                    <div className="p-2 bg-[#101411] border border-[#27342a] rounded-[2px]">
                      <div className="text-[10px] text-[#768a7b]">THROUGHPUT</div>
                      <div className="text-sm font-bold text-[#00bfff]">
                        {result.throughputMbps !== null && result.throughputMbps !== undefined ? `${result.throughputMbps} Mbps` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 bg-[#101411] border border-[#27342a] rounded-[2px]">
                      <div className="text-[10px] text-[#768a7b]">EXIT CODE</div>
                      <div className="text-sm font-bold text-[#d5e3d8]">
                        {result.exitCode !== undefined ? result.exitCode : 0}
                      </div>
                    </div>
                  </div>

                  {/* Raw Command & Terminal Output Log */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-[#768a7b] font-bold uppercase">// RAW SUBPROCESS OUTPUT</div>
                    <pre className="p-3 bg-[#0a0d0b] border border-[#27342a] rounded-[2px] text-[#00ff66] text-[11px] leading-normal overflow-x-auto max-h-80 font-mono whitespace-pre-wrap">
                      {result.rawOutput || result.errorMessage || '[No output output returned from execution worker]'}
                    </pre>
                  </div>
                </div>
              )}
            </NocPanel>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
