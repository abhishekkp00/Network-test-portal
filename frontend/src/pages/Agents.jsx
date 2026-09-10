import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Radio,
  RotateCw,
  Plus,
  Trash2,
  Terminal,
  Shield,
  Network,
  Search,
  KeyRound,
  Info,
  AlertTriangle,
  X,
  Check,
  Copy,
  SlidersHorizontal
} from 'lucide-react';
import {
  NocPanel,
  RetroButton,
  StatusIndicator,
  SectionHeader,
  MetricReadout,
  TerminalOutput
} from '../components/common';

export const Agents = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Newly Generated Token Modal State (Shown ONCE after Register or Rotate)
  const [newTokenData, setNewTokenData] = useState(null); // { agentId, name, token, actionType }
  const [copiedToken, setCopiedToken] = useState(false);

  // View Details Modal State
  const [detailAgent, setDetailAgent] = useState(null);

  // Confirmation Modal State (for Delete or Rotate Token)
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'DELETE'|'ROTATE', agent }
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchAgents = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError('');
    try {
      const data = await api.get('/agents');
      setAgents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve agent instances from registry.');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Register Agent Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsRegistering(true);
    setError('');
    try {
      const newAgent = await api.post('/agents', { name, description });
      setShowRegisterModal(false);
      setName('');
      setDescription('');
      
      // Prompt modal with secret token (shown ONCE)
      setNewTokenData({
        agentId: newAgent.id,
        name: newAgent.name,
        token: newAgent.token,
        actionType: 'REGISTER'
      });

      setSuccessMsg(`Agent '${newAgent.name}' registered successfully!`);
      fetchAgents(false);
    } catch (err) {
      setError(err.message || 'Failed to register new vantage agent.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Confirm Action Handler (Delete or Rotate Token)
  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    const { type, agent } = confirmAction;
    setActionProcessing(true);
    setError('');
    setSuccessMsg('');

    try {
      if (type === 'DELETE') {
        await api.delete(`/agents/${agent.id}`);
        setSuccessMsg(`Agent #${agent.id} '${agent.name}' successfully revoked and deleted.`);
        setConfirmAction(null);
        fetchAgents(false);
      } else if (type === 'ROTATE') {
        const rotatedAgent = await api.post(`/agents/${agent.id}/rotate-token`);
        setConfirmAction(null);
        // Show newly rotated secret token modal
        setNewTokenData({
          agentId: rotatedAgent.id,
          name: rotatedAgent.name,
          token: rotatedAgent.token,
          actionType: 'ROTATE'
        });
        setSuccessMsg(`Agent #${agent.id} token successfully rotated.`);
        fetchAgents(false);
      }
    } catch (err) {
      setError(err.message || `Failed to execute ${type.toLowerCase()} operation.`);
      setConfirmAction(null);
    } finally {
      setActionProcessing(false);
    }
  };

  const copyTokenToClipboard = (tokenText) => {
    navigator.clipboard.writeText(tokenText);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Never Connected';
    const d = new Date(dateTimeStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Metric counts
  const totalCount = agents.length;
  const onlineCount = agents.filter(a => a.status === 'ONLINE').length;
  const degradedCount = agents.filter(a => a.status === 'DEGRADED').length;
  const offlineCount = agents.filter(a => !a.status || a.status === 'OFFLINE').length;

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const idMatch = agent.id?.toString().includes(query);
        const nameMatch = (agent.name || '').toLowerCase().includes(query);
        const descMatch = (agent.description || '').toLowerCase().includes(query);
        if (!idMatch && !nameMatch && !descMatch) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const agentStatus = agent.status || 'OFFLINE';
        if (agentStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [agents, searchTerm, statusFilter]);

  if (loading && agents.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Interrogating Subnet Agent Inventory Registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono text-xs">
      
      {/* 1. PAGE HEADER */}
      <SectionHeader
        code="SYS_SUBNET_AGENTS"
        title="Network Operations Agent Inventory Console"
        subtitle="Coordinate and monitor distributed vantage probe workers across subnets"
        actions={
          <div className="flex items-center gap-2">
            <RetroButton variant="secondary" icon={RotateCw} onClick={() => fetchAgents(true)} disabled={loading}>
              Refresh Inventory
            </RetroButton>
            {isAdmin && (
              <RetroButton variant="primary" icon={Plus} onClick={() => setShowRegisterModal(true)}>
                Register Agent
              </RetroButton>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">[ERR.AGENT_SYSTEM]</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#ff3333] hover:text-[#d5e3d8]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#00ff66]/15 border border-[#00ff66]/40 rounded-[2px] text-[#00ff66] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">[OK.SYS]</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-[#00ff66] hover:text-[#d5e3d8]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPI INSTRUMENTATION STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricReadout label="REGISTERED AGENTS" value={totalCount} status="neutral" icon={Radio} subtext="Total inventory" />
        <MetricReadout label="ONLINE" value={onlineCount} status="green" icon={Network} subtext="Active polling" />
        <MetricReadout label="DEGRADED" value={degradedCount} status="amber" icon={AlertTriangle} subtext="High latency / stale" />
        <MetricReadout label="OFFLINE" value={offlineCount} status="red" icon={Radio} subtext="Unreachable workers" />
      </div>

      {/* 3. CONTROL & SEARCH BAR */}
      <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#768a7b]" />
          <input
            type="text"
            placeholder="Search agents by Agent ID, Name, Subnet Description..."
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

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#080b09] border border-[#27342a] px-2 py-1 rounded-[2px]">
            <span className="text-[10px] text-[#768a7b] font-bold">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#00ff66] focus:outline-none cursor-pointer font-mono font-bold"
            >
              <option value="ALL" className="bg-[#101411] text-[#d5e3d8]">ALL STATUSES</option>
              <option value="ONLINE" className="bg-[#101411] text-[#00ff66]">ONLINE</option>
              <option value="DEGRADED" className="bg-[#101411] text-[#ffb000]">DEGRADED</option>
              <option value="OFFLINE" className="bg-[#101411] text-[#ff3333]">OFFLINE</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'ALL') && (
            <RetroButton variant="danger" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>
              Reset Filters
            </RetroButton>
          )}
        </div>
      </div>

      {/* 4. COMPACT AGENT INVENTORY TABLE */}
      <NocPanel
        code="AGENT_INVENTORY"
        title={`Vantage Probe Instances (${filteredAgents.length} recorded)`}
        badge={<StatusIndicator status="ACTIVE" text="SUBNET REGISTRY" />}
        noPadding
      >
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="custom-table w-full text-left">
            <thead>
              <tr>
                <th className="w-20">AGENT ID</th>
                <th>AGENT NAME</th>
                <th>SUBNET / DESCRIPTION</th>
                <th>STATUS</th>
                <th>LAST SEEN</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-[#768a7b]">
                    NO VANTAGE AGENTS MATCH THE SEARCH OR FILTER CRITERIA.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  const agentStatus = agent.status || 'OFFLINE';

                  return (
                    <tr key={agent.id} className="hover:bg-[#151c17] transition-colors">
                      <td className="font-bold text-[#00ff66] font-mono">
                        #{agent.id}
                      </td>
                      <td className="font-semibold text-[#d5e3d8]">
                        <div className="flex items-center gap-1.5">
                          <span>{agent.name}</span>
                        </div>
                      </td>
                      <td className="text-[#768a7b] truncate max-w-xs">
                        {agent.description || 'Subnet Telemetry Probe'}
                      </td>
                      <td>
                        <StatusIndicator status={agentStatus} variant="dot" />
                      </td>
                      <td className="text-[11px] text-[#768a7b] font-mono">
                        {formatDateTime(agent.lastSeenAt)}
                      </td>
                      <td className="text-right space-x-1 whitespace-nowrap">
                        <RetroButton
                          variant="ghost"
                          size="sm"
                          icon={Info}
                          onClick={() => setDetailAgent(agent)}
                        >
                          Details
                        </RetroButton>

                        {isAdmin && (
                          <>
                            <RetroButton
                              variant="secondary"
                              size="sm"
                              icon={KeyRound}
                              onClick={() => setConfirmAction({ type: 'ROTATE', agent })}
                            >
                              Rotate Token
                            </RetroButton>

                            <RetroButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setConfirmAction({ type: 'DELETE', agent })}
                            >
                              Delete
                            </RetroButton>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NocPanel>

      {/* 5. REGISTER AGENT MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <NocPanel
              code="REGISTER_PROBE"
              title="Register Vantage Agent Probe"
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </RetroButton>
              }
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="form-label">Agent Node Identifier *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. US-WEST-SUBNET-PROBE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <div className="text-[10px] text-[#768a7b]">Unique identifier for this worker instance.</div>
                </div>

                <div className="space-y-1">
                  <label className="form-label">Subnet / Description</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. 10.240.0.0/16 - Oregon DC Subnet Probe"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <RetroButton variant="ghost" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </RetroButton>
                  <RetroButton type="submit" variant="primary" icon={Plus} disabled={isRegistering}>
                    {isRegistering ? 'Registering...' : 'Provision Agent Token'}
                  </RetroButton>
                </div>
              </form>
            </NocPanel>
          </div>
        </div>
      )}

      {/* 6. SECRET TOKEN GENERATED MODAL (SHOWN ONCE UPON REGISTRATION OR ROTATION) */}
      {newTokenData && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <NocPanel
              code="SECRET_CREDENTIALS"
              title={`Agent Security Token // ${newTokenData.actionType}`}
              status="warning"
              badge={<StatusIndicator status="WARNING" text="SHOWN ONCE" />}
            >
              <div className="space-y-4 font-mono text-xs">
                
                <div className="p-3 bg-[#ffb000]/10 border border-[#ffb000]/40 rounded-[2px] text-[#ffb000] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>IMPORTANT: SAVE SECURITY TOKEN NOW</span>
                  </div>
                  <div className="text-[11px] text-[#d5e3d8]">
                    This plaintext secret token is displayed <strong>ONCE</strong> upon generation. Only its SHA-256 hash is stored on the server.
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-[#768a7b] uppercase">
                    // AGENT: #{newTokenData.agentId} — {newTokenData.name}
                  </div>
                  <div className="p-3 bg-[#080b09] border border-[#00ff66]/50 rounded-[2px] flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#00ff66] font-bold select-all break-all">
                      {newTokenData.token}
                    </span>
                    <RetroButton
                      variant="primary"
                      size="sm"
                      icon={copiedToken ? Check : Copy}
                      onClick={() => copyTokenToClipboard(newTokenData.token)}
                    >
                      {copiedToken ? 'Copied!' : 'Copy'}
                    </RetroButton>
                  </div>
                </div>

                {/* Worker command preview */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#768a7b] uppercase">// DAEMON LAUNCH COMMAND</div>
                  <pre className="p-2.5 bg-[#080b09] border border-[#27342a] rounded-[2px] text-[#00ff66] text-[10px] overflow-x-auto whitespace-pre-wrap">
{`export PORTAL_SERVER_URL="${window.location.protocol}//${window.location.host}"
export AGENT_TOKEN="${newTokenData.token}"

python3 python-agent/agent_client.py`}
                  </pre>
                </div>

                <div className="pt-2 flex justify-end">
                  <RetroButton variant="primary" onClick={() => setNewTokenData(null)}>
                    I Have Saved This Token
                  </RetroButton>
                </div>

              </div>
            </NocPanel>
          </div>
        </div>
      )}

      {/* 7. VIEW DETAILS MODAL */}
      {detailAgent && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <NocPanel
              code={`AGENT_TELEMETRY // #${detailAgent.id}`}
              title={`Agent Detail Specifications // ${detailAgent.name}`}
              badge={<StatusIndicator status={detailAgent.status || 'OFFLINE'} variant="dot" />}
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setDetailAgent(null)}>
                  Close
                </RetroButton>
              }
            >
              <div className="space-y-4 font-mono text-xs">
                
                {/* Agent Detail Grid */}
                <div className="bg-[#101411] border border-[#27342a] p-3 rounded-[2px] grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// AGENT ID</span>
                    <span className="font-bold text-[#00ff66]">#{detailAgent.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// AGENT NAME</span>
                    <span className="font-bold text-[#d5e3d8]">{detailAgent.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// STATUS</span>
                    <StatusIndicator status={detailAgent.status || 'OFFLINE'} variant="dot" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// LAST SEEN</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(detailAgent.lastSeenAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// CREATED AT</span>
                    <span className="text-[#d5e3d8]">{formatDateTime(detailAgent.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#768a7b] block uppercase">// CREDENTIAL STATUS</span>
                    <span className="text-[#00ff66] font-bold">[TOKEN HASHED & SECURED]</span>
                  </div>
                </div>

                {/* Subnet Description */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#768a7b] font-bold uppercase">// SUBNET / DESCRIPTION</div>
                  <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] text-[#d5e3d8]">
                    {detailAgent.description || 'No detailed subnet description provided.'}
                  </div>
                </div>

                {/* Worker Daemon Instructions */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#768a7b] font-bold uppercase">// WORKER DAEMON EXECUTION SNIPPET</div>
                  <TerminalOutput
                    output={`# Subnet Worker Daemon Execution Command\nexport PORTAL_SERVER_URL="${window.location.protocol}//${window.location.host}"\nexport AGENT_TOKEN="<NODE_SECRET_TOKEN>"\n\npython3 python-agent/agent_client.py`}
                    title={`DEPLOYMENT WORKER RUNTIME // AGENT #${detailAgent.id}`}
                    maxHeight="max-h-48"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  {isAdmin && (
                    <>
                      <RetroButton
                        variant="secondary"
                        size="sm"
                        icon={KeyRound}
                        onClick={() => {
                          const ag = detailAgent;
                          setDetailAgent(null);
                          setConfirmAction({ type: 'ROTATE', agent: ag });
                        }}
                      >
                        Rotate Token
                      </RetroButton>

                      <RetroButton
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => {
                          const ag = detailAgent;
                          setDetailAgent(null);
                          setConfirmAction({ type: 'DELETE', agent: ag });
                        }}
                      >
                        Delete Agent
                      </RetroButton>
                    </>
                  )}
                  <RetroButton variant="ghost" onClick={() => setDetailAgent(null)}>
                    Close
                  </RetroButton>
                </div>

              </div>
            </NocPanel>
          </div>
        </div>
      )}

      {/* 8. DESTRUCTIVE ACTION CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 bg-[#080b09]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <NocPanel
              code="CONFIRM_OPERATION"
              title={`Confirm Agent ${confirmAction.type === 'DELETE' ? 'Revocation' : 'Token Rotation'}`}
              status="danger"
              badge={<StatusIndicator status="WARNING" text="CONFIRMATION REQUIRED" />}
            >
              <div className="space-y-4 font-mono text-xs">
                
                <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] text-[#ff3333] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      {confirmAction.type === 'DELETE' ? 'CRITICAL: Revoke & Delete Agent' : 'WARNING: Rotate Security Credentials'}
                    </div>
                    <div className="text-[11px] text-[#d5e3d8]">
                      {confirmAction.type === 'DELETE'
                        ? `Are you sure you want to delete Agent #${confirmAction.agent.id} '${confirmAction.agent.name}'? Remote worker daemons using this token will lose access immediately.`
                        : `Are you sure you want to rotate token credentials for Agent #${confirmAction.agent.id} '${confirmAction.agent.name}'? The existing worker token will be invalidated immediately.`}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#101411] border border-[#27342a] rounded-[2px] space-y-1">
                  <div className="text-[10px] text-[#768a7b] uppercase">// TARGET NODE METADATA</div>
                  <div className="text-[#00ff66] font-bold">#{confirmAction.agent.id} — {confirmAction.agent.name}</div>
                  <div className="text-[10px] text-[#768a7b]">{confirmAction.agent.description || 'No description'}</div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <RetroButton variant="ghost" onClick={() => setConfirmAction(null)} disabled={actionProcessing}>
                    Cancel
                  </RetroButton>
                  <RetroButton
                    variant="danger"
                    onClick={executeConfirmedAction}
                    disabled={actionProcessing}
                  >
                    {actionProcessing
                      ? 'Processing...'
                      : confirmAction.type === 'DELETE'
                      ? 'Confirm Revocation'
                      : 'Confirm Rotation'}
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

export default Agents;
