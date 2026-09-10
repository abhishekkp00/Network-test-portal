import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Radio, RotateCw, Plus, Eye, EyeOff, Trash2, Terminal, Shield, Network } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator, SectionHeader, MetricReadout } from '../components/common';

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
      setSuccess(`Agent '${newAgent.name}' registered successfully! Token generated below.`);
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
      setSuccess('Agent successfully revoked.');
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

  const isAdmin = user?.role === 'ADMIN';
  const onlineCount = agents.filter(a => a.status === 'ONLINE').length;
  const degradedCount = agents.filter(a => a.status === 'DEGRADED').length;
  const offlineCount = agents.filter(a => !a.status || a.status === 'OFFLINE').length;

  return (
    <div className="container space-y-6">
      <SectionHeader
        code="SYS_SUBNET_AGENTS"
        title="Subnet Vantage Agents"
        subtitle="Coordinate distributed remote execution nodes across subnets"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={fetchAgents} disabled={loading}>
            Refresh Status
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR]</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-[#00ff66]/15 border border-[#00ff66]/40 rounded-[2px] font-mono text-xs text-[#00ff66] flex items-center gap-2">
          <span className="font-bold">[OK]</span>
          <span>{success}</span>
        </div>
      )}

      {/* Summary Readout Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricReadout label="TOTAL NODES" value={agents.length} status="neutral" icon={Radio} />
        <MetricReadout label="ONLINE" value={onlineCount} status="green" icon={Network} />
        <MetricReadout label="DEGRADED" value={degradedCount} status="amber" icon={Radio} />
        <MetricReadout label="OFFLINE" value={offlineCount} status="red" icon={Radio} />
      </div>

      {/* Topology Overview */}
      <NocPanel code="NET_MAP" title="Subnet Topology & Communication Links">
        {agents.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-[#768a7b]">
            No subnet agent nodes provisioned yet. Register a new node to establish network link telemetry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 bg-[#101411] border border-[#27342a] rounded-[2px] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#d5e3d8] truncate">{agent.name}</span>
                  <StatusIndicator status={agent.status || 'OFFLINE'} />
                </div>
                <div className="text-[10px] text-[#768a7b] truncate">
                  {agent.description || 'Remote Subnet Telemetry Probe'}
                </div>
                <div className="pt-1 border-t border-[#27342a] flex items-center justify-between text-[10px] text-[#4e5f52]">
                  <span>NODE #{agent.id}</span>
                  <span>{agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleTimeString() : 'Never Connected'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </NocPanel>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* AGENTS TABLE */}
        <div className={isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <NocPanel code="NODES_LIST" title="Active Telemetry Node Registry" noPadding>
            <div className="table-container border-0 rounded-none">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>NODE / SUBNET</th>
                    <th>STATUS</th>
                    <th>SECURITY TOKEN</th>
                    <th>LAST SEEN</th>
                    {isAdmin && <th className="text-right">ACTION</th>}
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-[#768a7b]">
                        No active subnet agents registered.
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent.id}>
                        <td>
                          <div className="font-bold text-[#d5e3d8]">{agent.name}</div>
                          <div className="text-[10px] text-[#768a7b]">{agent.description}</div>
                        </td>
                        <td>
                          <StatusIndicator status={agent.status || 'OFFLINE'} />
                        </td>
                        <td className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[#00ff66]">
                              {visibleTokens[agent.id] ? agent.token : '••••••••-••••-••••-••••••••'}
                            </span>
                            <RetroButton 
                              variant="ghost" 
                              size="sm"
                              icon={visibleTokens[agent.id] ? EyeOff : Eye}
                              onClick={() => toggleTokenVisibility(agent.id)}
                            >
                              {visibleTokens[agent.id] ? 'Hide' : 'Show'}
                            </RetroButton>
                          </div>
                        </td>
                        <td className="text-[11px] text-[#768a7b]">
                          {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : 'N/A'}
                        </td>
                        {isAdmin && (
                          <td className="text-right">
                            <RetroButton 
                              variant="danger" 
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDelete(agent.id)}
                            >
                              Revoke
                            </RetroButton>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </NocPanel>
        </div>

        {/* REGISTER & DEPLOYMENT OPTIONS */}
        {isAdmin && (
          <div className="lg:col-span-4 space-y-6">
            {/* REGISTER FORM */}
            <NocPanel code="PROVISION_NODE" title="Register Vantage Agent">
              <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
                <div className="form-group">
                  <label className="form-label">Node Identifier</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Subnet-A-Probe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subnet / Description</label>
                  <textarea 
                    className="form-control" 
                    placeholder="192.168.10.0/24 - Oregon Subnet"
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <RetroButton 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  disabled={isRegistering}
                  icon={Plus}
                >
                  {isRegistering ? 'Generating...' : 'Generate Node Token'}
                </RetroButton>
              </form>
            </NocPanel>

            {/* DEPLOYMENT GUIDE */}
            <NocPanel code="DEPLOY_INSTRUCTIONS" title="Node Run Instructions">
              <div className="space-y-2 font-mono text-xs text-[#768a7b]">
                <p>
                  Deploy the Python worker daemon on target subnet host:
                </p>
                <pre className="p-2.5 bg-[#0a0d0b] border border-[#27342a] rounded-[2px] text-[#00ff66] text-[10px] overflow-x-auto whitespace-pre-wrap">
{`export PORTAL_SERVER_URL="${window.location.protocol}//${window.location.host}"
export AGENT_TOKEN="<node-token>"

python3 python-agent/agent_client.py`}
                </pre>
              </div>
            </NocPanel>
          </div>
        )}

      </div>
    </div>
  );
};

export default Agents;
