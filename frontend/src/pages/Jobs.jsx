import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'RUNNING': return 'badge-running';
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-failed';
      case 'TIMEOUT': return 'badge-timeout';
      default: return '';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading job lists...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Test Jobs</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Real-time telemetry and state tracking of execution scripts.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchJobs()} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div 
          style={{ 
            padding: '16px', 
            backgroundColor: 'var(--color-danger-glass)', 
            color: 'var(--color-danger)', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '24px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          {error}
        </div>
      )}

      {/* Jobs Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile Name</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Effective Target</th>
                <th>Triggered At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No execution jobs found. Run a Test Profile to initiate one.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td>#{j.id}</td>
                    <td style={{ fontWeight: '600' }}>{j.profileName}</td>
                    <td>{j.requestedByUsername}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(j.status)}`}>
                        {j.status}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.85rem' }}>
                        {j.effectiveProtocol === 'PING' ? j.effectiveHost : `${j.effectiveServer}:${j.effectivePort}`}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(j.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {['SUCCESS', 'FAILED', 'TIMEOUT'].includes(j.status) ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => viewResult(j.id)}
                        >
                          View Result
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingRight: '10px' }}>
                          <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Running...</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TELEMETRY RESULTS MODAL */}
      {selectedJobId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Job #{selectedJobId} Telemetry</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={closeResultModal}>
                Close
              </button>
            </div>

            {resultLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', gap: '8px', alignItems: 'center' }}>
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Retrieving test outcomes...</span>
              </div>
            )}

            {resultError && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-glass)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {resultError}
              </div>
            )}

            {result && (
              <div>
                {/* Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {result.packetLossPct !== null && (
                    <div className="glass-panel" style={{ padding: '16px', background: 'rgba(10, 13, 22, 0.4)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Packet Loss</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: result.packetLossPct > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>
                        {result.packetLossPct.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {result.throughputMbps !== null && (
                    <div className="glass-panel" style={{ padding: '16px', background: 'rgba(10, 13, 22, 0.4)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Throughput</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-info)', marginTop: '4px' }}>
                        {result.throughputMbps.toFixed(2)} Mbps
                      </div>
                    </div>
                  )}
                  {result.rttAvgMs !== null && (
                    <div className="glass-panel" style={{ padding: '16px', background: 'rgba(10, 13, 22, 0.4)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RTT Avg</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '4px' }}>
                        {result.rttAvgMs.toFixed(2)} ms
                      </div>
                    </div>
                  )}
                  {result.jitterMs !== null && (
                    <div className="glass-panel" style={{ padding: '16px', background: 'rgba(10, 13, 22, 0.4)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jitter</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning)', marginTop: '4px' }}>
                        {result.jitterMs.toFixed(2)} ms
                      </div>
                    </div>
                  )}
                </div>

                {result.rttMinMs !== null && (
                  <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Min RTT:</span> <strong style={{ color: 'var(--text-primary)' }}>{result.rttMinMs} ms</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Max RTT:</span> <strong style={{ color: 'var(--text-primary)' }}>{result.rttMaxMs} ms</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Exit Code:</span> <strong>{result.exitCode}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${result.parsedStatus === 'SUCCESS' ? 'badge-success' : 'badge-failed'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{result.parsedStatus}</span></div>
                  </div>
                )}

                {result.errorMessage && (
                  <div style={{ padding: '14px', backgroundColor: 'var(--color-danger-glass)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <strong>Execution Error:</strong> {result.errorMessage}
                  </div>
                )}

                {/* Raw Terminal Console */}
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', justifyContent: 'between' }}>
                    <span>Raw CLI Output</span>
                  </div>
                  <pre 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      backgroundColor: '#05070c', 
                      border: '1px solid var(--border-glass)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.8rem', 
                      color: '#22c55e', 
                      overflowX: 'auto', 
                      maxHeight: '300px',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {result.rawOutput || 'No stdout output generated.'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
