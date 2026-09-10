import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCw, Play, History, Edit3, Trash2, X } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator, SectionHeader, NocTelemetryChart } from '../components/common';

const validateHostOrIp = (value) => {
  if (!value) return false;
  const trimmed = value.trim();
  
  if (trimmed.length > 253) return false;
  
  // Reject shell metacharacters and spaces
  const dangerousChars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r', ' ', '\t', '\'', '"', '*', '?'];
  for (let char of dangerousChars) {
    if (trimmed.includes(char)) return false;
  }
  
  const ipv4Regex = /^(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  
  return ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || hostRegex.test(trimmed);
};

export const Profiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & Forms State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState('PING');
  const [host, setHost] = useState('');
  const [server, setServer] = useState('');
  const [count, setCount] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [port, setPort] = useState(5201);
  const [notes, setNotes] = useState('');

  // Scheduling State
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [cronPreset, setCronPreset] = useState('0 0 * * * *');
  const [cronExpression, setCronExpression] = useState('0 0 * * * *');
  const [isCustomCron, setIsCustomCron] = useState(false);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const openHistoryModal = async (profile) => {
    setSelectedProfile(profile);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError('');
    setHistoryData([]);
    try {
      const data = await api.get(`/results/profile/${profile.id}`);
      setHistoryData(data);
    } catch (err) {
      setHistoryError(err.message || 'Failed to fetch history data.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Overrides Fields for Triggering Job
  const [hostOverride, setHostOverride] = useState('');
  const [serverOverride, setServerOverride] = useState('');
  const [countOverride, setCountOverride] = useState('');
  const [durationSecondsOverride, setDurationSecondsOverride] = useState('');
  const [portOverride, setPortOverride] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/profiles');
      setProfiles(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch profiles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const agents = await api.get('/agents');
      setAvailableAgents(agents || []);
    } catch (e) {
      console.error('Failed to fetch agents', e);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAvailableAgents();
  }, []);

  const openCreateForm = () => {
    setEditingProfile(null);
    setName('');
    setDescription('');
    setProtocol('PING');
    setHost('');
    setServer('');
    setCount(5);
    setDurationSeconds(10);
    setPort(5201);
    setNotes('');
    setScheduleEnabled(false);
    setCronPreset('0 0 * * * *');
    setCronExpression('0 0 * * * *');
    setIsCustomCron(false);
    setIsFormOpen(true);
  };

  const openEditForm = (profile) => {
    setEditingProfile(profile);
    setName(profile.name || '');
    setDescription(profile.description || '');
    setProtocol(profile.protocol || 'PING');
    setHost(profile.host || '');
    setServer(profile.server || '');
    setCount(profile.count || 5);
    setDurationSeconds(profile.durationSeconds || 10);
    setPort(profile.port || 5201);
    setNotes(profile.notes || '');
    setScheduleEnabled(profile.scheduleEnabled || false);
    setCronExpression(profile.cronExpression || '0 0 * * * *');
    setCronPreset(profile.cronExpression || 'CUSTOM');
    setIsCustomCron(!['0 */5 * * * *', '0 */15 * * * *', '0 0 * * * *', '0 0 */12 * * *', '0 0 0 * * *'].includes(profile.cronExpression));
    setIsFormOpen(true);
  };

  const openTriggerModal = (profile) => {
    setSelectedProfile(profile);
    setHostOverride('');
    setServerOverride('');
    setCountOverride('');
    setDurationSecondsOverride('');
    setPortOverride('');
    setSelectedAgentId('');
    setIsTriggerOpen(true);
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test profile?')) return;
    try {
      await api.delete(`/profiles/${id}`);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete profile.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitization & Validation
    if (protocol === 'PING') {
      if (!validateHostOrIp(host)) {
        setError('Invalid Target Host. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell metacharacters.');
        return;
      }
      const countInt = parseInt(count);
      if (isNaN(countInt) || countInt < 1 || countInt > 50) {
        setError('Ping count must be an integer between 1 and 50.');
        return;
      }
    } else {
      if (!validateHostOrIp(server)) {
        setError('Invalid iPerf Server Host. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell metacharacters.');
        return;
      }
      const portInt = parseInt(port);
      if (isNaN(portInt) || portInt < 1 || portInt > 65535) {
        setError('Port must be between 1 and 65535.');
        return;
      }
      const durationInt = parseInt(durationSeconds);
      if (isNaN(durationInt) || durationInt < 1 || durationInt > 120) {
        setError('Duration must be between 1 and 120 seconds.');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      protocol,
      host: protocol === 'PING' ? host.trim() : null,
      server: protocol === 'IPERF' ? server.trim() : null,
      count: protocol === 'PING' ? parseInt(count) : null,
      durationSeconds: protocol === 'IPERF' ? parseInt(durationSeconds) : null,
      port: protocol === 'IPERF' ? parseInt(port) : null,
      notes: notes.trim(),
      scheduleEnabled,
      cronExpression: scheduleEnabled ? cronExpression.trim() : null
    };

    try {
      if (editingProfile) {
        const updated = await api.put(`/profiles/${editingProfile.id}`, payload);
        setProfiles(profiles.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.post('/profiles', payload);
        setProfiles([...profiles, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save test profile.');
    }
  };

  const handleTriggerJob = async (e) => {
    e.preventDefault();
    setIsTriggering(true);
    setError('');

    // Input overrides Sanitization & Validations
    if (selectedProfile.protocol === 'PING') {
      if (hostOverride && !validateHostOrIp(hostOverride)) {
        setError('Invalid Host Override. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell characters.');
        setIsTriggering(false);
        return;
      }
      if (countOverride) {
        const countInt = parseInt(countOverride);
        if (isNaN(countInt) || countInt < 1 || countInt > 50) {
          setError('Ping count override must be between 1 and 50.');
          setIsTriggering(false);
          return;
        }
      }
    } else {
      if (serverOverride && !validateHostOrIp(serverOverride)) {
        setError('Invalid Server Override. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell characters.');
        setIsTriggering(false);
        return;
      }
      if (portOverride) {
        const portInt = parseInt(portOverride);
        if (isNaN(portInt) || portInt < 1 || portInt > 65535) {
          setError('Port override must be between 1 and 65535.');
          setIsTriggering(false);
          return;
        }
      }
      if (durationSecondsOverride) {
        const durationInt = parseInt(durationSecondsOverride);
        if (isNaN(durationInt) || durationInt < 1 || durationInt > 120) {
          setError('Duration override must be between 1 and 120 seconds.');
          setIsTriggering(false);
          return;
        }
      }
    }

    const body = {
      profileId: selectedProfile.id,
      hostOverride: hostOverride ? hostOverride.trim() : null,
      serverOverride: serverOverride ? serverOverride.trim() : null,
      protocolOverride: selectedProfile.protocol,
      countOverride: countOverride ? parseInt(countOverride) : null,
      durationSecondsOverride: durationSecondsOverride ? parseInt(durationSecondsOverride) : null,
      portOverride: portOverride ? parseInt(portOverride) : null,
      agentId: selectedAgentId ? parseInt(selectedAgentId) : null
    };

    try {
      await api.post('/jobs', body);
      setIsTriggerOpen(false);
      alert('Job successfully queued! Navigate to Test Jobs to monitor status.');
    } catch (err) {
      setError(err.message || 'Failed to trigger network test job.');
    } finally {
      setIsTriggering(false);
    }
  };

  const isAuthorizedToModify = (profile) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'OPERATOR') {
      return !profile || profile.createdByUsername === user.username;
    }
    return false;
  };

  const canTrigger = user.role === 'ADMIN' || user.role === 'OPERATOR';

  if (loading && profiles.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Loading diagnostic profiles...</span>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <SectionHeader
        code="SYS_PROFILES"
        title="Diagnostic Test Profiles"
        subtitle="Configure target hosts, ping parameters, and cron scheduling"
        actions={
          <>
            {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
              <RetroButton variant="primary" icon={Plus} onClick={openCreateForm}>
                Create Profile
              </RetroButton>
            )}
            <RetroButton variant="secondary" icon={RotateCw} onClick={fetchProfiles} disabled={loading}>
              Refresh
            </RetroButton>
          </>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR]</span>
          <span>{error}</span>
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.length === 0 ? (
          <div className="col-span-full">
            <NocPanel code="INFO">
              <div className="text-center text-xs font-mono text-[#768a7b] py-6">
                No diagnostic test profiles provisioned yet. Click "Create Profile" to start.
              </div>
            </NocPanel>
          </div>
        ) : (
          profiles.map((p) => (
            <NocPanel
              key={p.id}
              code={`PRF-${p.id}`}
              title={p.name}
              badge={
                <div className="flex items-center gap-1.5">
                  {p.scheduleEnabled && (
                    <StatusIndicator status="WARNING" text="CRON" pulse={false} />
                  )}
                  <StatusIndicator 
                    status={p.protocol === 'PING' ? 'RUNNING' : 'SUCCESS'} 
                    text={p.protocol} 
                    pulse={false}
                  />
                </div>
              }
            >
              <div className="space-y-3 font-mono text-xs">
                <p className="text-[#768a7b] text-[11px] line-clamp-2">
                  {p.description || 'No description provided.'}
                </p>

                <div className="bg-[#101411] border border-[#27342a] p-2.5 rounded-[2px] space-y-1 text-[11px]">
                  {p.protocol === 'PING' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#768a7b]">Target Host:</span>
                        <span className="text-[#00bfff] font-bold">{p.host}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#768a7b]">Ping Count:</span>
                        <span className="text-[#d5e3d8]">{p.count} packets</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#768a7b]">Server Host:</span>
                        <span className="text-[#00ff66] font-bold">{p.server}:{p.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#768a7b]">Duration:</span>
                        <span className="text-[#d5e3d8]">{p.durationSeconds}s</span>
                      </div>
                    </>
                  )}
                  {p.scheduleEnabled && (
                    <div className="flex justify-between border-t border-[#27342a] pt-1 mt-1">
                      <span className="text-[#768a7b]">Cron Schedule:</span>
                      <span className="text-[#ffb000] font-bold">{p.cronExpression}</span>
                    </div>
                  )}
                </div>

                {p.notes && (
                  <div className="text-[10px] text-[#4e5f52] italic truncate">
                    * {p.notes}
                  </div>
                )}

                <div className="pt-2 border-t border-[#27342a] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#768a7b]">
                    By: {p.createdByUsername}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAuthorizedToModify(p) && (
                      <>
                        <RetroButton variant="ghost" size="sm" icon={Edit3} onClick={() => openEditForm(p)}>
                          Edit
                        </RetroButton>
                        <RetroButton variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteProfile(p.id)}>
                          Del
                        </RetroButton>
                      </>
                    )}
                    <RetroButton variant="secondary" size="sm" icon={History} onClick={() => openHistoryModal(p)}>
                      Hist
                    </RetroButton>
                    {canTrigger && (
                      <RetroButton variant="primary" size="sm" icon={Play} onClick={() => openTriggerModal(p)}>
                        Run
                      </RetroButton>
                    )}
                  </div>
                </div>
              </div>
            </NocPanel>
          ))
        )}
      </div>

      {/* CREATE / EDIT PROFILE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <NocPanel
              code="SYS.CONFIG"
              title={editingProfile ? 'Edit Test Profile' : 'Create Test Profile'}
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setIsFormOpen(false)}>
                  Close
                </RetroButton>
              }
            >
              <form onSubmit={handleSaveProfile} className="space-y-3 font-mono text-xs">
                <div className="form-group">
                  <label className="form-label">Profile Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Gateway Ping Probe" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Describe purpose" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Protocol</label>
                  <select className="form-control" value={protocol} onChange={e => setProtocol(e.target.value)}>
                    <option value="PING">PING (ICMP Latency check)</option>
                    <option value="IPERF">IPERF (Throughput check)</option>
                  </select>
                </div>

                {protocol === 'PING' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 form-group">
                      <label className="form-label">Target Host IP / Domain</label>
                      <input type="text" className="form-control" required value={host} onChange={e => setHost(e.target.value)} placeholder="8.8.8.8" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ping Count</label>
                      <input type="number" className="form-control" min="1" max="50" required value={count} onChange={e => setCount(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="form-group">
                      <label className="form-label">Server Host</label>
                      <input type="text" className="form-control" required value={server} onChange={e => setServer(e.target.value)} placeholder="iperf.server.net" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Port</label>
                      <input type="number" className="form-control" min="1024" max="65535" required value={port} onChange={e => setPort(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration (s)</label>
                      <input type="number" className="form-control" min="2" max="60" required value={durationSeconds} onChange={e => setDurationSeconds(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Scheduling Config */}
                <div className="p-3 bg-[#101411] border border-[#27342a] rounded-[2px] space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="scheduleEnabled" 
                      checked={scheduleEnabled} 
                      onChange={e => setScheduleEnabled(e.target.checked)} 
                      className="cursor-pointer"
                    />
                    <label htmlFor="scheduleEnabled" className="form-label mb-0 cursor-pointer text-[#d5e3d8]">
                      Enable Automated Cron Scheduling
                    </label>
                  </div>

                  {scheduleEnabled && (
                    <div className="space-y-2 pt-2 border-t border-[#27342a]">
                      <div className="form-group mb-0">
                        <label className="form-label">Check Interval</label>
                        <select 
                          className="form-control" 
                          value={cronPreset} 
                          onChange={e => {
                            const val = e.target.value;
                            setCronPreset(val);
                            if (val !== 'CUSTOM') {
                              setCronExpression(val);
                              setIsCustomCron(false);
                            } else {
                              setIsCustomCron(true);
                            }
                          }}
                        >
                          <option value="0 */5 * * * *">Every 5 Minutes</option>
                          <option value="0 */15 * * * *">Every 15 Minutes</option>
                          <option value="0 0 * * * *">Hourly</option>
                          <option value="0 0 */12 * * *">Every 12 Hours</option>
                          <option value="0 0 0 * * *">Daily</option>
                          <option value="CUSTOM">Custom Cron Expression</option>
                        </select>
                      </div>

                      {isCustomCron && (
                        <div className="form-group mb-0">
                          <label className="form-label">Cron Expression (sec min hr dom mon dow)</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            value={cronExpression} 
                            onChange={e => setCronExpression(e.target.value)} 
                            placeholder="0 0/30 8-18 * * *" 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Notes</label>
                  <input type="text" className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes" />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#27342a]">
                  <RetroButton variant="secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </RetroButton>
                  <RetroButton type="submit" variant="primary">
                    {editingProfile ? 'Save Changes' : 'Create Profile'}
                  </RetroButton>
                </div>
              </form>
            </NocPanel>
          </div>
        </div>
      )}

      {/* TRIGGER OVERRIDES MODAL */}
      {isTriggerOpen && selectedProfile && (
        <div className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <NocPanel
              code="SYS.EXEC"
              title="Trigger Diagnostic Job"
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setIsTriggerOpen(false)}>
                  Close
                </RetroButton>
              }
            >
              <form onSubmit={handleTriggerJob} className="space-y-3 font-mono text-xs">
                <p className="text-[#768a7b] text-[11px]">
                  Specify execution overrides or leave blank to use profile defaults.
                </p>

                {selectedProfile.protocol === 'PING' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Host Override (Default: {selectedProfile.host})</label>
                      <input type="text" className="form-control" value={hostOverride} onChange={e => setHostOverride(e.target.value)} placeholder="IP or Domain" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Count Override (Default: {selectedProfile.count})</label>
                      <input type="number" className="form-control" min="1" max="50" value={countOverride} onChange={e => setCountOverride(e.target.value)} placeholder="Ping count" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Server Override (Default: {selectedProfile.server})</label>
                      <input type="text" className="form-control" value={serverOverride} onChange={e => setServerOverride(e.target.value)} placeholder="Server host" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Port Override (Default: {selectedProfile.port})</label>
                      <input type="number" className="form-control" min="1024" max="65535" value={portOverride} onChange={e => setPortOverride(e.target.value)} placeholder="iPerf port" />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Execution Agent</label>
                  <select className="form-control" value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}>
                    <option value="">Local Portal Core (Default)</option>
                    {availableAgents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.status || 'UNKNOWN'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#27342a]">
                  <RetroButton variant="secondary" onClick={() => setIsTriggerOpen(false)} disabled={isTriggering}>
                    Cancel
                  </RetroButton>
                  <RetroButton type="submit" variant="primary" disabled={isTriggering} icon={Play}>
                    {isTriggering ? 'Queuing...' : 'Execute Now'}
                  </RetroButton>
                </div>
              </form>
            </NocPanel>
          </div>
        </div>
      )}

      {/* HISTORY GRAPH MODAL */}
      {isHistoryOpen && selectedProfile && (
        <div className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <NocPanel
              code="SYS.HIST"
              title={`${selectedProfile.name} // Performance History`}
              action={
                <RetroButton variant="ghost" size="sm" icon={X} onClick={() => setIsHistoryOpen(false)}>
                  Close
                </RetroButton>
              }
            >
              {historyLoading && (
                <div className="py-12 text-center font-mono text-xs text-[#768a7b]">
                  [SYS.INFO] Fetching metric telemetry history...
                </div>
              )}

              {historyError && (
                <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333]">
                  [ERR] {historyError}
                </div>
              )}

              {!historyLoading && !historyError && historyData.length === 0 && (
                <div className="py-12 text-center font-mono text-xs text-[#768a7b]">
                  No execution history found for this profile.
                </div>
              )}

              {!historyLoading && !historyError && historyData.length > 0 && (
                <div className="space-y-4 font-mono">
                  <div className="text-xs text-[#768a7b]">
                    Displaying engineering telemetry plot over last {historyData.length} run samples:
                  </div>

                  {/* 1. RTT / Latency / Throughput Instrumentation */}
                  <NocTelemetryChart
                    title={selectedProfile.protocol === 'PING' ? "RTT Latency Telemetry (ms)" : "Throughput Telemetry (Mbps)"}
                    code={selectedProfile.protocol}
                    data={historyData.map((d, i) => ({
                      sample: `#${i + 1}`,
                      time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      rttAvg: d.rttAvgMs,
                      rttMin: d.rttMinMs,
                      rttMax: d.rttMaxMs,
                      throughput: d.throughputMbps
                    }))}
                    metrics={
                      selectedProfile.protocol === 'PING'
                        ? [
                            { key: 'rttAvg', name: 'RTT Avg', color: '#00ff66', unit: 'ms' },
                            { key: 'rttMin', name: 'RTT Min', color: '#00bfff', unit: 'ms' },
                            { key: 'rttMax', name: 'RTT Max', color: '#ffb000', unit: 'ms' }
                          ]
                        : [
                            { key: 'throughput', name: 'Throughput', color: '#00bfff', unit: 'Mbps' }
                          ]
                    }
                    height={200}
                  />

                  {/* 2. Packet Loss & Jitter Instrumentation */}
                  <NocTelemetryChart
                    title="Packet Loss & Jitter Telemetry"
                    code="FAULTS // DISRUPTION"
                    data={historyData.map((d, i) => ({
                      sample: `#${i + 1}`,
                      time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      loss: d.packetLossPct,
                      jitter: d.jitterMs
                    }))}
                    metrics={[
                      { key: 'loss', name: 'Packet Loss', color: '#ff3333', unit: '%' },
                      { key: 'jitter', name: 'Jitter', color: '#ffb000', unit: 'ms' }
                    ]}
                    height={200}
                  />

                  {/* 3. Availability / Success Instrumentation */}
                  <NocTelemetryChart
                    title="Availability & Health Telemetry (%)"
                    code="UPTIME // DISPATCH"
                    data={historyData.map((d, i) => ({
                      sample: `#${i + 1}`,
                      time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      availability: d.exitCode === 0 || d.parsedStatus === 'SUCCESS' ? 100 : 0
                    }))}
                    metrics={[
                      { key: 'availability', name: 'Availability', color: '#00ff66', unit: '%' }
                    ]}
                    height={160}
                  />

                </div>
              )}
            </NocPanel>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
