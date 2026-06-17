import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

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
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Security Audit Logs</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Comprehensive records of system configuration changes and user operations.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading} style={{ marginLeft: 'auto' }}>
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

      {/* Audit Logs Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Target Object</th>
                <th>Log Message</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No audit logs available in database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td style={{ fontWeight: '600' }}>{log.username}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.7rem',
                          backgroundColor: log.actionType.includes('DELETE') || log.actionType.includes('FAIL') 
                            ? 'var(--color-danger-glass)' 
                            : log.actionType.includes('CREATE') || log.actionType.includes('REGISTER') || log.actionType.includes('FINISH')
                              ? 'var(--color-success-glass)'
                              : 'var(--color-info-glass)',
                          color: log.actionType.includes('DELETE') || log.actionType.includes('FAIL') 
                            ? 'var(--color-danger)' 
                            : log.actionType.includes('CREATE') || log.actionType.includes('REGISTER') || log.actionType.includes('FINISH')
                              ? 'var(--color-success)'
                              : 'var(--color-info)'
                        }}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {log.entityType} ({log.entityId ? `#${log.entityId}` : 'N/A'})
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>{log.message}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
