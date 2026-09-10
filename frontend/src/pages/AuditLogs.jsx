import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { RotateCw, FileText, Shield } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator, SectionHeader, MetricReadout } from '../components/common';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/audit-logs');
      // Sort logs by ID desc (most recent first)
      const sortedLogs = data.sort((a, b) => b.id - a.id);
      setLogs(sortedLogs);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const d = new Date(dateTimeStr);
    return d.toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Loading security audit trail logs...</span>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <SectionHeader
        code="SYS_AUDIT_LOGS"
        title="Security & System Audit Logs"
        subtitle="Cryptographic & configuration activity audit trail"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={fetchLogs} disabled={loading}>
            Refresh Audit Logs
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR]</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Readout Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricReadout label="TOTAL AUDIT ENTRIES" value={logs.length} status="neutral" icon={FileText} />
        <MetricReadout label="LAST AUDITED BY" value={logs[0]?.username || 'SYSTEM'} status="cyan" icon={Shield} />
        <MetricReadout label="LATEST LOG ID" value={logs[0] ? `#${logs[0].id}` : 'N/A'} status="green" icon={RotateCw} />
      </div>

      <NocPanel code="AUDIT_STREAM" title="Audit Trail Execution Records" noPadding>
        <div className="table-container border-0 rounded-none">
          <table className="custom-table">
            <thead>
              <tr>
                <th>LOG ID</th>
                <th>OPERATOR</th>
                <th>ACTION TYPE</th>
                <th>TARGET ENTITY</th>
                <th>MESSAGE Telemetry</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#768a7b]">
                    No security audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isDanger = log.actionType?.includes('DELETE') || log.actionType?.includes('FAIL') || log.actionType?.includes('REVOKE');
                  const isSuccess = log.actionType?.includes('CREATE') || log.actionType?.includes('REGISTER') || log.actionType?.includes('FINISH') || log.actionType?.includes('LOGIN');
                  
                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-[#00ff66]">#{log.id}</td>
                      <td className="font-bold text-[#d5e3d8]">{log.username}</td>
                      <td>
                        <StatusIndicator 
                          status={isDanger ? 'FAILED' : isSuccess ? 'SUCCESS' : 'RUNNING'} 
                          text={log.actionType} 
                          pulse={false}
                        />
                      </td>
                      <td className="font-mono text-[#768a7b]">
                        {log.entityType} ({log.entityId ? `#${log.entityId}` : 'N/A'})
                      </td>
                      <td className="text-xs text-[#d5e3d8] max-w-xs truncate">{log.message}</td>
                      <td className="text-[11px] text-[#768a7b]">{formatDateTime(log.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NocPanel>
    </div>
  );
};

export default AuditLogs;
