import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { RotateCw, Play, Square, Cpu, HardDrive, Server } from 'lucide-react';
import {
  NocPanel,
  RetroButton,
  StatusIndicator,
  SectionHeader,
  MetricReadout,
  TerminalPanel
} from '../components/common';

export const Diagnostics = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Live SSE Console State
  const [liveHost, setLiveHost] = useState('8.8.8.8');
  const [liveProtocol, setLiveProtocol] = useState('PING');
  const [liveCount, setLiveCount] = useState(5);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getTimestampStr = () => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    return `[${hrs}:${mins}:${secs}]`;
  };

  const startLiveTest = () => {
    if (!liveHost.trim()) {
      alert("Destination host cannot be empty.");
      return;
    }

    const host = liveHost.trim();
    const ts = getTimestampStr();

    setTerminalLines([
      `${ts} Starting diagnostic...`,
      `${getTimestampStr()} Target: ${host}`,
      `${getTimestampStr()} Running ${liveProtocol.toLowerCase()} (${liveCount} count)...`
    ]);
    setIsRunning(true);

    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const url = `${baseUrl}/diagnostics/live-stream?host=${encodeURIComponent(host)}&protocol=${liveProtocol}&count=${liveCount}&token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data) {
        const timeHeader = getTimestampStr();
        setTerminalLines((prev) => [...prev, `${timeHeader} ${event.data}`]);
      }
    };

    es.addEventListener('exit', (event) => {
      const timeHeader = getTimestampStr();
      const exitCode = event.data;
      setTerminalLines((prev) => [
        ...prev,
        `${timeHeader} Process completed with exit code: ${exitCode}`,
        `${getTimestampStr()} Diagnostic completed.`
      ]);
      es.close();
      setIsRunning(false);
    });

    es.addEventListener('error', () => {
      const timeHeader = getTimestampStr();
      setTerminalLines((prev) => [
        ...prev,
        `${timeHeader} Error: Connection closed or failed to reach host ${host}`
      ]);
      es.close();
      setIsRunning(false);
    });
  };

  const stopLiveTest = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    const timeHeader = getTimestampStr();
    setTerminalLines((prev) => [
      ...prev,
      `${timeHeader} Warning: Diagnostic process manually terminated by user.`,
      `${getTimestampStr()} Diagnostic stopped.`
    ]);
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
    let isMounted = true;
    api.get('/system/diagnostics')
      .then(data => { if (isMounted) setReport(data); })
      .catch(err => { if (isMounted) setError(err.message || 'Failed to retrieve system diagnostics.'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  if (loading && !report) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Running system diagnostic inspection...</span>
      </div>
    );
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const d = new Date(dateTimeStr);
    return d.toLocaleString();
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Page Header */}
      <SectionHeader
        code="SYS_DIAGNOSTICS"
        title="System Diagnostic Report & SSE Execution Console"
        subtitle="Verify process binaries, worker scripts, and host resource telemetry"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={fetchDiagnostics} disabled={loading}>
            Retest System
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR.DIAGNOSTICS]</span>
          <span>{error}</span>
        </div>
      )}

      {report && (
        <>
          {/* Status Banner */}
          <NocPanel
            code="SYS.ORCHESTRATOR"
            title="System Orchestrator Status"
            status={report.overallStatus === 'SUCCESS' ? 'success' : 'danger'}
            badge={
              <StatusIndicator 
                status={report.overallStatus === 'SUCCESS' ? 'HEALTHY' : 'DEGRADED'} 
                text={report.overallStatus === 'SUCCESS' ? 'ONLINE' : 'ATTENTION'} 
              />
            }
          >
            <div className="font-mono text-xs text-[#768a7b]">
              Diagnostic Inspection Timestamp: <span className="text-[#d5e3d8] font-bold">{formatDateTime(report.timestamp)}</span>
            </div>
          </NocPanel>

          {/* Host Resource Telemetry Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricReadout
              label="HOST CPU LOAD"
              value={report.cpuUsagePct}
              unit="%"
              progress={report.cpuUsagePct}
              status={report.cpuUsagePct > 80 ? 'amber' : 'green'}
              icon={Cpu}
              subtext="Real-time core processing load"
            />
            <MetricReadout
              label="HOST MEMORY (RAM)"
              value={report.memoryUsagePct}
              unit="%"
              progress={report.memoryUsagePct}
              status={report.memoryUsagePct > 85 ? 'red' : 'amber'}
              icon={Server}
              subtext="Allocated RAM capacity"
            />
            <MetricReadout
              label="HOST DISK SPACE"
              value={report.diskUsagePct}
              unit="%"
              progress={report.diskUsagePct}
              status={report.diskUsagePct > 90 ? 'red' : 'green'}
              icon={HardDrive}
              subtext="Active partition storage"
            />
          </div>

          {/* Diagnostic Components Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NocPanel
              code="SYS.PYTHON"
              title="Python Executable"
              badge={<StatusIndicator status={report.pythonStatus === 'OK' ? 'HEALTHY' : 'FAILED'} text={report.pythonStatus} />}
            >
              <div className="font-mono text-xs space-y-1.5 text-[#768a7b]">
                <div>Command Target: <code className="text-[#00bfff]">python3</code></div>
                <div className="text-[10px] text-[#d5e3d8] truncate">{report.pythonDetails}</div>
              </div>
            </NocPanel>

            <NocPanel
              code="SCRIPT.PING"
              title="Ping Worker Script"
              badge={<StatusIndicator status={report.pingScriptStatus === 'OK' ? 'HEALTHY' : 'FAILED'} text={report.pingScriptStatus} />}
            >
              <div className="font-mono text-xs space-y-1.5 text-[#768a7b]">
                <div>Target Path: <code className="text-[#00bfff]">ping_worker.py</code></div>
                <div className="text-[10px] text-[#d5e3d8] truncate">{report.pingScriptDetails}</div>
              </div>
            </NocPanel>

            <NocPanel
              code="SCRIPT.IPERF"
              title="iPerf Worker Script"
              badge={<StatusIndicator status={report.iperfScriptStatus === 'OK' ? 'HEALTHY' : 'FAILED'} text={report.iperfScriptStatus} />}
            >
              <div className="font-mono text-xs space-y-1.5 text-[#768a7b]">
                <div>Target Path: <code className="text-[#00bfff]">iperf_worker.py</code></div>
                <div className="text-[10px] text-[#d5e3d8] truncate">{report.iperfScriptDetails}</div>
              </div>
            </NocPanel>

            <NocPanel
              code="BIN.PING"
              title="System Ping Binary"
              badge={<StatusIndicator status={report.pingBinaryStatus === 'OK' ? 'HEALTHY' : 'FAILED'} text={report.pingBinaryStatus} />}
            >
              <div className="font-mono text-xs space-y-1.5 text-[#768a7b]">
                <div>Binary Target: <code className="text-[#00bfff]">/bin/ping</code></div>
                <div className="text-[10px] text-[#d5e3d8] truncate">{report.pingBinaryDetails}</div>
              </div>
            </NocPanel>

            <NocPanel
              code="BIN.IPERF3"
              title="System iPerf3 Binary"
              badge={<StatusIndicator status={report.iperfBinaryStatus === 'OK' ? 'HEALTHY' : 'FAILED'} text={report.iperfBinaryStatus} />}
            >
              <div className="font-mono text-xs space-y-1.5 text-[#768a7b]">
                <div>Binary Target: <code className="text-[#00bfff]">/usr/bin/iperf3</code></div>
                <div className="text-[10px] text-[#d5e3d8] truncate">{report.iperfBinaryDetails}</div>
              </div>
            </NocPanel>
          </div>

          {/* INTERACTIVE LIVE TERMINAL CONSOLE */}
          <NocPanel
            code="LIVE_STREAM // SSE"
            title="Interactive Live Telemetry Terminal"
          >
            <div className="space-y-4 font-mono text-xs">
              <p className="text-[#768a7b] text-[11px]">
                Execute live network diagnostic probes directly from the portal server. Telemetry stdout stream is captured in real time via Server-Sent Events (SSE).
              </p>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="form-label">Destination Host / IP</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={liveHost}
                    onChange={(e) => setLiveHost(e.target.value)}
                    placeholder="8.8.8.8"
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label">Protocol / Tool</label>
                  <select
                    className="form-control cursor-pointer"
                    value={liveProtocol}
                    onChange={(e) => setLiveProtocol(e.target.value)}
                    disabled={isRunning}
                  >
                    <option value="PING">PING (ICMP Latency check)</option>
                    <option value="TRACEPATH">TRACEPATH (Network path routing)</option>
                  </select>
                </div>

                {liveProtocol === 'PING' ? (
                  <div className="space-y-1">
                    <label className="form-label">Packet Count</label>
                    <select
                      className="form-control cursor-pointer"
                      value={liveCount}
                      onChange={(e) => setLiveCount(parseInt(e.target.value))}
                      disabled={isRunning}
                    >
                      <option value="3">3 Packets</option>
                      <option value="5">5 Packets</option>
                      <option value="10">10 Packets</option>
                      <option value="15">15 Packets</option>
                    </select>
                  </div>
                ) : <div />}

                <div>
                  {isRunning ? (
                    <RetroButton variant="danger" fullWidth icon={Square} onClick={stopLiveTest}>
                      Stop Stream
                    </RetroButton>
                  ) : (
                    <RetroButton variant="primary" fullWidth icon={Play} onClick={startLiveTest}>
                      Start Live Diagnostic
                    </RetroButton>
                  )}
                </div>
              </div>

              {/* REUSABLE CRT TERMINAL PANEL */}
              <TerminalPanel
                lines={terminalLines}
                title={`LIVE DIAGNOSTIC CONSOLE // TARGET: ${liveHost || 'UNSPECIFIED'}`}
                code={`SSE stream (${liveProtocol})`}
                isRunning={isRunning}
                onClear={() => setTerminalLines([])}
                onStop={isRunning ? stopLiveTest : undefined}
                maxHeight="max-h-96"
                minHeight="min-h-64"
              />

            </div>
          </NocPanel>
        </>
      )}
    </div>
  );
};

export default Diagnostics;
