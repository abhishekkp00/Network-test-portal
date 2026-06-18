import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const Agents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State (Admin only)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Token visibility map
  const [visibleTokens, setVisibleTokens] = useState({});

  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/agents');
      setAgents(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve agent instances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsRegistering(true);
    setError('');
    setSuccess('');
    try {
      const newAgent = await api.post('/agents', { name, description });
      setSuccess(`Agent '${newAgent.name}' registered successfully! Copy its token below.`);
      setName('');
      setDescription('');
      fetchAgents();
    } catch (err) {
      setError(err.message || 'Failed to register new agent.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent? Remote nodes using this token will lose access.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/agents/${id}`);
      setSuccess('Agent successfully deleted.');
      fetchAgents();
    } catch (err) {
      setError(err.message || 'Failed to delete agent.');
    }
  };

  const toggleTokenVisibility = (id) => {
    setVisibleTokens(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusBadge = (lastSeenAt) => {
    if (!lastSeenAt) {
      return (
        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
          Never Connected
        </span>
      );
    }

    const lastSeenDate = new Date(lastSeenAt);
    const diffSeconds = (new Date() - lastSeenDate) / 1000;

    if (diffSeconds < 25) {
      return (
        <span className="badge" style={{ backgroundColor: 'var(--color-success-glass)', color: 'var(--color-success)' }}>
          ● Online
        </span>
      );
    } else {
      return (
        <span className="badge" style={{ backgroundColor: 'var(--color-danger-glass)', color: 'var(--color-danger)' }}>
          ● Offline
        </span>
      );
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Subnet Agents</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Monitor and coordinate remote python diagnostic agents running on separate subnets.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAgents} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Topology Styles */}
      <style>{`
        @keyframes portalPulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes packetStream {
          0% { left: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>

      {/* Network NOC Topology Dashboard */}
      <div className="glass-panel" style={{ marginBottom: '30px', padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌐 NOC Subnet Topology Map</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'var(--color-primary-glass)', padding: '2px 8px', borderRadius: '4px', transform: 'scale(0.95)', fontWeight: 'bold' }}>Live Link Status</span>
        </h2>
        {agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No agent nodes currently active in the topology. Register and start an agent to visualize the network links.
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(10, 13, 22, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            border: '1px solid var(--border-glass)',
            minHeight: '160px',
            flexWrap: 'wrap',
            gap: '30px'
          }}>
            {/* Center Node */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-primary)',
              background: 'rgba(99, 102, 241, 0.08)',
              position: 'relative',
              minWidth: '200px',
              textAlign: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-md)',
                top: 0,
                left: 0,
                animation: 'portalPulse 2.5s infinite ease-in-out',
                pointerEvents: 'none'
              }}></div>
              <span style={{ fontSize: '2rem', marginBottom: '6px' }}>🖥️</span>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#82aaff' }}>Portal Controller</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>localhost:8082</span>
            </div>

            {/* Connecting Channels & Nodes Container */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              flex: 1, 
              minWidth: '280px' 
            }}>
              {agents.map((agent) => {
                const isOnline = agent.lastSeenAt && ((new Date() - new Date(agent.lastSeenAt)) / 1000) < 25;
                const statusColor = isOnline ? 'var(--color-success)' : 'var(--color-danger)';
                const statusLabel = isOnline ? 'Online' : 'Offline';
                return (
                  <div key={agent.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px' 
                  }}>
                    {/* Animated Connection Cable */}
                    <div style={{ 
                      flex: 1, 
                      height: '2px', 
                      background: isOnline 
                        ? 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-success) 100%)' 
                        : 'rgba(255, 255, 255, 0.05)', 
                      position: 'relative',
                      minWidth: '80px',
                      borderRadius: '1px'
                    }}>
                      {isOnline && (
                        <div className="topo-packet" style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-success)',
                          boxShadow: '0 0 10px var(--color-success)',
                          top: '-3px',
                          animation: 'packetStream 2.0s infinite linear'
                        }}></div>
                      )}
                    </div>

                    {/* Agent Node box */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glass)',
                      minWidth: '260px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {agent.description || 'Remote Subnet Endpoint'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: statusColor,
                          boxShadow: `0 0 10px ${statusColor}`,
                          animation: isOnline ? 'pulse 1.8s infinite' : 'none'
                        }}></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isOnline ? 'var(--color-success)' : 'var(--text-muted)' }}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-glass)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px', backgroundColor: 'var(--color-success-glass)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.5fr 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* AGENTS LIST */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Active Subnet Nodes</h2>
          
          {loading && agents.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No subnet agents registered yet. {isAdmin ? 'Use the form to register one.' : ''}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px' }}>Name / Subnet</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px' }}>Security Token</th>
                    <th style={{ padding: '12px 8px' }}>Last Seen</th>
                    {isAdmin && <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: '600' }}>{agent.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{agent.description}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {getStatusBadge(agent.lastSeenAt)}
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>
                            {visibleTokens[agent.id] ? agent.token : '••••••••-••••-••••-••••-••••••••••••'}
                          </span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            onClick={() => toggleTokenVisibility(agent.id)}
                          >
                            {visibleTokens[agent.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleDelete(agent.id)}
                          >
                            Revoke
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REGISTER & DEPLOYMENT OPTIONS */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* REGISTER FORM */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Register New Node</h2>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Agent Node Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Subnet-A-VantagePoint"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subnet / Description</label>
                  <textarea 
                    className="form-control" 
                    placeholder="e.g. 192.168.10.0/24 - AWS Oregon VPC"
                    style={{ minHeight: '60px' }}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isRegistering}>
                  {isRegistering ? 'Registering...' : 'Generate Node Token'}
                </button>
              </form>
            </div>

            {/* DEPLOYMENT GUIDE */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-glass)' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚀 Agent Run Instructions</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Run the python client on the target subnet host to make it available for distributed pings and bandwidth tests:
              </p>
              <pre style={{ background: '#0a0d16', padding: '12px', borderRadius: '4px', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-glass)', color: '#82aaff', marginTop: '12px' }}>
{`# 1. Set environment configurations
export PORTAL_SERVER_URL="${window.location.protocol}//${window.location.host}"
export AGENT_TOKEN="<your-node-token>"

# 2. Run agent script
python3 python-agent/agent_client.py`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
