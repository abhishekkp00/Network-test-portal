import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export const Diagnostics = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Live Console State
  const [liveHost, setLiveHost] = useState('8.8.8.8');
  const [liveProtocol, setLiveProtocol] = useState('PING');
  const [liveCount, setLiveCount] = useState(5);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startLiveTest = () => {
    if (!liveHost.trim()) {
      alert("Destination host cannot be empty.");
      return;
    }
    setTerminalLines(["[System] Starting live connection to " + liveHost + " via " + liveProtocol + "..."]);
    setIsRunning(true);

    const token = localStorage.getItem('token');
    // Call the Spring SSE streaming API
    const url = `http://localhost:8082/api/v1/diagnostics/live-stream?host=${encodeURIComponent(liveHost.trim())}&protocol=${liveProtocol}&count=${liveCount}&token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      setTerminalLines((prev) => [...prev, event.data]);
    };

    es.addEventListener('exit', (event) => {
      setTerminalLines((prev) => [...prev, `\n[Process completed with exit code: ${event.data}]`]);
      es.close();
      setIsRunning(false);
    });

    es.addEventListener('error', (event) => {
      setTerminalLines((prev) => [...prev, `\n[Connection closed or failed to reach host]`]);
      es.close();
      setIsRunning(false);
    });
  };

  const stopLiveTest = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setTerminalLines((prev) => [...prev, `\n[Process manually terminated by user]`]);
    setIsRunning(false);
  };

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

          {/* Host Resource Telemetry Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(10, 13, 22, 0.45)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host CPU Load</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{report.cpuUsagePct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${report.cpuUsagePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-info) 100%)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-time processing core utilization.</span>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(10, 13, 22, 0.45)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host Memory (RAM)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{report.memoryUsagePct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${report.memoryUsagePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-warning) 0%, #f97316 100%)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Memory allocated on virtualized host.</span>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(10, 13, 22, 0.45)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host Disk Space</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{report.diskUsagePct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${report.diskUsagePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-success) 0%, #22c55e 100%)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active partition storage capacity.</span>
            </div>
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

          {/* INTERACTIVE LIVE TERMINAL SECTION */}
          <div className="glass-panel" style={{ marginTop: '35px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 6px 0', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.6rem' }}>
                Interactive Live Console
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Execute live network probes directly from the core server sub-interfaces. Streams stdout output line-by-line using Server-Sent Events (SSE).
              </p>
            </div>

            {/* Form Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Destination Host / IP</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={liveHost}
                  onChange={(e) => setLiveHost(e.target.value)}
                  placeholder="e.g. 8.8.8.8"
                  disabled={isRunning}
                  style={{ background: 'rgba(10, 13, 22, 0.8)', borderColor: 'var(--border-glass)' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Protocol / Tool</label>
                <select
                  className="form-control"
                  value={liveProtocol}
                  onChange={(e) => setLiveProtocol(e.target.value)}
                  disabled={isRunning}
                  style={{ background: 'rgba(10, 13, 22, 0.8)', color: 'var(--text-primary)', borderColor: 'var(--border-glass)' }}
                >
                  <option value="PING">PING (ICMP Latency check)</option>
                  <option value="TRACEPATH">TRACEPATH (Network path routing)</option>
                </select>
              </div>

              {liveProtocol === 'PING' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Packet Count</label>
                  <select
                    className="form-control"
                    value={liveCount}
                    onChange={(e) => setLiveCount(parseInt(e.target.value))}
                    disabled={isRunning}
                    style={{ background: 'rgba(10, 13, 22, 0.8)', color: 'var(--text-primary)', borderColor: 'var(--border-glass)' }}
                  >
                    <option value="3">3 Packets</option>
                    <option value="5">5 Packets</option>
                    <option value="10">10 Packets</option>
                    <option value="15">15 Packets</option>
                  </select>
                </div>
              )}

              <div>
                {isRunning ? (
                  <button className="btn btn-danger" onClick={stopLiveTest} style={{ width: '100%', padding: '10px' }}>
                    Stop Execution
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={startLiveTest} style={{ width: '100%', padding: '10px' }}>
                    Start Live Test
                  </button>
                )}
              </div>
            </div>

            {/* Glowing Live Terminal */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isRunning && <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1.5px' }}></span>}
                  Live Console Stdout
                </span>
                {terminalLines.length > 0 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setTerminalLines([])}
                    style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    disabled={isRunning}
                  >
                    Clear Console
                  </button>
                )}
              </div>
              <div 
                style={{ 
                  padding: '18px', 
                  backgroundColor: '#030508', 
                  border: '1px solid rgba(34, 197, 94, 0.25)', 
                  borderRadius: 'var(--radius-sm)', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.8rem', 
                  color: '#4ade80', 
                  minHeight: '260px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)'
                }}
              >
                {terminalLines.length === 0 ? (
                  <span style={{ color: '#4b5563' }}>Console inactive. Select a target and click "Start Live Test" to watch real-time stream.</span>
                ) : (
                  terminalLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Diagnostics;
