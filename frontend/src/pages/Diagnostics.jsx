import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const Diagnostics = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/system/diagnostics');
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve system diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (loading && !report) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading system diagnostics...</span>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    return status === 'OK' || status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
  };

  const getCardBorderStyle = (status) => {
    return status === 'OK' 
      ? '1px solid rgba(16, 185, 129, 0.2)' 
      : '1px solid rgba(239, 68, 68, 0.2)';
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const d = new Date(dateTimeStr);
    return d.toLocaleString();
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>System Diagnostics</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Verify active backend processes, Python workers, and system utility binaries.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchDiagnostics} disabled={loading}>
            {loading ? 'Testing...' : 'Retest System'}
          </button>
        </div>
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

      {report && (
        <>
          {/* Status Banner */}
          <div 
            className="glass-panel" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '30px', 
              padding: '24px',
              border: getCardBorderStyle(report.overallStatus),
              background: report.overallStatus === 'SUCCESS' ? 'var(--color-success-glass)' : 'var(--color-danger-glass)'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>
                System Orchestrator: {report.overallStatus === 'SUCCESS' ? 'HEALTHY' : 'DEGRADED'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Last Checked: {formatDateTime(report.timestamp)}
              </p>
            </div>
            <span 
              className={`badge ${getStatusBadgeClass(report.overallStatus)}`}
              style={{ fontSize: '1rem', padding: '8px 16px' }}
            >
              {report.overallStatus === 'SUCCESS' ? 'ONLINE' : 'ATTENTION'}
            </span>
          </div>

          {/* Diagnostic Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Python Executable Card */}
            <div className="glass-panel" style={{ border: getCardBorderStyle(report.pythonStatus) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Python Executable</h3>
                <span className={`badge ${getStatusBadgeClass(report.pythonStatus)}`}>
                  {report.pythonStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Configured Command:</span>
                  <code style={{ marginLeft: '8px', color: 'var(--color-info)' }}>python3</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Version Details:</span>
                  <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {report.pythonDetails}
                  </p>
                </div>
              </div>
            </div>

            {/* Ping Script Card */}
            <div className="glass-panel" style={{ border: getCardBorderStyle(report.pingScriptStatus) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Ping Worker Script</h3>
                <span className={`badge ${getStatusBadgeClass(report.pingScriptStatus)}`}>
                  {report.pingScriptStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Relative Target:</span>
                  <code style={{ marginLeft: '8px', color: 'var(--color-info)' }}>../python-workers/ping_worker.py</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Script Integrity:</span>
                  <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {report.pingScriptDetails}
                  </p>
                </div>
              </div>
            </div>

            {/* iPerf Script Card */}
            <div className="glass-panel" style={{ border: getCardBorderStyle(report.iperfScriptStatus) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>iPerf Worker Script</h3>
                <span className={`badge ${getStatusBadgeClass(report.iperfScriptStatus)}`}>
                  {report.iperfScriptStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Relative Target:</span>
                  <code style={{ marginLeft: '8px', color: 'var(--color-info)' }}>../python-workers/iperf_worker.py</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Script Integrity:</span>
                  <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {report.iperfScriptDetails}
                  </p>
                </div>
              </div>
            </div>

            {/* Ping Binary Card */}
            <div className="glass-panel" style={{ border: getCardBorderStyle(report.pingBinaryStatus) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>System Ping Binary</h3>
                <span className={`badge ${getStatusBadgeClass(report.pingBinaryStatus)}`}>
                  {report.pingBinaryStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Command Target:</span>
                  <code style={{ marginLeft: '8px', color: 'var(--color-info)' }}>ping</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Execution Diagnostics:</span>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                    {report.pingBinaryDetails}
                  </p>
                </div>
              </div>
            </div>

            {/* iPerf3 Binary Card */}
            <div className="glass-panel" style={{ border: getCardBorderStyle(report.iperfBinaryStatus) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>System iPerf3 Binary</h3>
                <span className={`badge ${getStatusBadgeClass(report.iperfBinaryStatus)}`}>
                  {report.iperfBinaryStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Command Target:</span>
                  <code style={{ marginLeft: '8px', color: 'var(--color-info)' }}>iperf3</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Execution Diagnostics:</span>
                  <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {report.iperfBinaryDetails}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Diagnostics;
