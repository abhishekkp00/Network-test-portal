import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const validateHostOrIp = (value) => {
  if (!value) return false;
  const trimmed = value.trim();
  
  if (trimmed.length > 253) return false;
  
  // Reject shell metacharacters and spaces
  const dangerousChars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r', ' ', '\t', '\'', '\"', '*', '?'];
  for (let char of dangerousChars) {
    if (trimmed.includes(char)) return false;
  }
  
  const ipv4Regex = /^(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  
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

  useEffect(() => {
    fetchProfiles();
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
    setName(profile.name);
    setDescription(profile.description || '');
    setProtocol(profile.protocol);
    setHost(profile.host || '');
    setServer(profile.server || '');
    setCount(profile.count || 5);
    setDurationSeconds(profile.durationSeconds || 10);
    setPort(profile.port || 5201);
    setNotes(profile.notes || '');
    setScheduleEnabled(profile.scheduleEnabled || false);
    setCronExpression(profile.cronExpression || '0 0 * * * *');
    
    const presets = ['0 */5 * * * *', '0 */15 * * * *', '0 0 * * * *', '0 0 */12 * * *', '0 0 0 * * *'];
    if (profile.cronExpression && presets.includes(profile.cronExpression)) {
      setCronPreset(profile.cronExpression);
      setIsCustomCron(false);
    } else if (profile.cronExpression) {
      setCronPreset('CUSTOM');
      setIsCustomCron(true);
    } else {
      setCronPreset('0 0 * * * *');
      setIsCustomCron(false);
    }
    setIsFormOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');

    // Input Sanitization & Validations
    if (protocol === 'PING') {
      if (!validateHostOrIp(host)) {
        setError('Invalid Target Host. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell characters.');
        return;
      }
      const countInt = parseInt(count);
      if (isNaN(countInt) || countInt < 1 || countInt > 50) {
        setError('Ping count must be between 1 and 50.');
        return;
      }
    } else {
      if (!validateHostOrIp(server)) {
        setError('Invalid iPerf Server Host. Must be a valid domain name, IPv4, or IPv6 address without spaces or shell characters.');
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

    if (scheduleEnabled) {
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        setError('Invalid Cron Expression. Must be a valid standard cron expression (5 or 6 fields).');
        return;
      }
    }

    const body = {
      name: name.trim(),
      description: description.trim(),
      protocol,
      host: protocol === 'PING' ? host.trim() : null,
      server: protocol === 'IPERF' ? server.trim() : null,
      count: protocol === 'PING' ? parseInt(count) : null,
      durationSeconds: protocol === 'IPERF' ? parseInt(durationSeconds) : null,
      port: protocol === 'IPERF' ? parseInt(port) : null,
      notes: notes.trim(),
      cronExpression: scheduleEnabled ? cronExpression.trim() : null,
      scheduleEnabled
    };

    try {
      if (editingProfile) {
        const updated = await api.put(`/profiles/${editingProfile.id}`, body);
        setProfiles(profiles.map(p => p.id === editingProfile.id ? updated : p));
      } else {
        const created = await api.post('/profiles', body);
        setProfiles([...profiles, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    }
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

  const openTriggerModal = (profile) => {
    setSelectedProfile(profile);
    setHostOverride('');
    setServerOverride('');
    setCountOverride('');
    setDurationSecondsOverride('');
    setPortOverride('');
    setIsTriggerOpen(true);
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
      portOverride: portOverride ? parseInt(portOverride) : null
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
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading test profiles...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Test Profiles</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Configure test environments and execute PING or IPERF3 diagnostics.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <button className="btn btn-primary" onClick={openCreateForm}>
              Create Profile
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchProfiles} disabled={loading}>
            Refresh
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

      {/* Profiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {profiles.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No test profiles created yet. Click "Create Profile" to start.</p>
          </div>
        ) : (
          profiles.map((p) => (
            <div key={p.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{p.name}</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {p.scheduleEnabled && (
                      <span className="badge" style={{ backgroundColor: 'var(--color-warning-glass)', color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        CRON
                      </span>
                    )}
                    <span className={`badge ${p.protocol === 'PING' ? 'badge-running' : 'badge-success'}`}>
                      {p.protocol}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  {p.description || 'No description provided.'}
                </p>

                <div style={{ background: 'rgba(10, 13, 22, 0.4)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  {p.protocol === 'PING' ? (
                    <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Target Host:</span>
                      <code style={{ color: 'var(--color-info)' }}>{p.host}</code>
                      <span style={{ color: 'var(--text-muted)' }}>Pings:</span>
                      <span>{p.count} packets</span>
                      {p.scheduleEnabled && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>
                          <span style={{ color: 'var(--color-warning)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.cronExpression}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Server Host:</span>
                      <code style={{ color: 'var(--color-success)' }}>{p.server}</code>
                      <span style={{ color: 'var(--text-muted)' }}>Port:</span>
                      <span>{p.port}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                      <span>{p.durationSeconds} seconds</span>
                      {p.scheduleEnabled && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>
                          <span style={{ color: 'var(--color-warning)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.cronExpression}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {p.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '16px' }}>
                    * {p.notes}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  By: {p.createdByUsername}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {isAuthorizedToModify(p) && (
                    <>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEditForm(p)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteProfile(p.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openHistoryModal(p)}>
                    History
                  </button>
                  {canTrigger && (
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openTriggerModal(p)}>
                      Run Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT PROFILE FORM (MODAL-LIKE OVERLAY) */}
      {isFormOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>{editingProfile ? 'Edit Test Profile' : 'Create Test Profile'}</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Profile Name</label>
                <input type="text" className="form-control" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Gateway Ping" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" style={{ resize: 'vertical', minHeight: '60px' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the purpose of this profile" />
              </div>

              <div className="form-group">
                <label className="form-label">Protocol</label>
                <select className="form-control" value={protocol} onChange={e => setProtocol(e.target.value)}>
                  <option value="PING">PING (ICMP Latency check)</option>
                  <option value="IPERF">IPERF (Throughput check)</option>
                </select>
              </div>

              {protocol === 'PING' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Target Host IP / Domain</label>
                    <input type="text" className="form-control" required value={host} onChange={e => setHost(e.target.value)} placeholder="e.g. 8.8.8.8" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ping Count</label>
                    <input type="number" className="form-control" min="1" max="50" required value={count} onChange={e => setCount(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">iPerf Server Host</label>
                    <input type="text" className="form-control" required value={server} onChange={e => setServer(e.target.value)} placeholder="e.g. iperf.he.net" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port</label>
                    <input type="number" className="form-control" min="1024" max="65535" required value={port} onChange={e => setPort(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (seconds)</label>
                    <input type="number" className="form-control" min="2" max="60" required value={durationSeconds} onChange={e => setDurationSeconds(e.target.value)} />
                  </div>
                </>
              )}

              {/* Scheduling Config */}
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: scheduleEnabled ? '12px' : 0 }}>
                  <input 
                    type="checkbox" 
                    id="scheduleEnabled" 
                    checked={scheduleEnabled} 
                    onChange={e => setScheduleEnabled(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="scheduleEnabled" style={{ fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                    Enable Automated Cron Scheduling
                  </label>
                </div>

                {scheduleEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
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
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Custom Cron Expression (6 fields: sec min hour day mon dow)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={cronExpression} 
                          onChange={e => setCronExpression(e.target.value)} 
                          placeholder="e.g. 0 0/30 8-18 * * *" 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Internal Notes</label>
                <input type="text" className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Requires local utility permissions" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProfile ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRIGGER OVERRIDES PROMPT MODAL */}
      {isTriggerOpen && selectedProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '8px' }}>Trigger Network Test</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Modify settings to override variables for this run, or leave them empty to use default profile parameters.
            </p>
            <form onSubmit={handleTriggerJob}>
              {selectedProfile.protocol === 'PING' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Host Override (Default: {selectedProfile.host})</label>
                    <input type="text" className="form-control" value={hostOverride} onChange={e => setHostOverride(e.target.value)} placeholder="Enter override IP/domain" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Count Override (Default: {selectedProfile.count})</label>
                    <input type="number" className="form-control" min="1" max="50" value={countOverride} onChange={e => setCountOverride(e.target.value)} placeholder="Enter custom ping count" />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Server Override (Default: {selectedProfile.server})</label>
                    <input type="text" className="form-control" value={serverOverride} onChange={e => setServerOverride(e.target.value)} placeholder="Enter override server address" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port Override (Default: {selectedProfile.port})</label>
                    <input type="number" className="form-control" min="1024" max="65535" value={portOverride} onChange={e => setPortOverride(e.target.value)} placeholder="Enter custom iPerf port" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration Override (Default: {selectedProfile.durationSeconds}s)</label>
                    <input type="number" className="form-control" min="2" max="60" value={durationSecondsOverride} onChange={e => setDurationSecondsOverride(e.target.value)} placeholder="Enter custom test duration" />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTriggerOpen(false)} disabled={isTriggering}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isTriggering}>
                  {isTriggering ? 'Queuing...' : 'Execute Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY GRAPH MODAL */}
      {isHistoryOpen && selectedProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>{selectedProfile.name} - Performance History</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setIsHistoryOpen(false)}>
                Close
              </button>
            </div>

            {historyLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', gap: '8px', alignItems: 'center' }}>
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading history data...</span>
              </div>
            )}

            {historyError && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-glass)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && historyData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No execution history found for this profile. Run a test first to generate metrics.
              </div>
            )}

            {!historyLoading && !historyError && historyData.length > 0 && (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Showing metrics over the last {historyData.length} executions.
                </p>

                {/* Latency / Throughput Line Chart */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {selectedProfile.protocol === 'PING' ? 'Average Latency (RTT Avg)' : 'Throughput'}
                  </h4>
                  <div style={{ width: '100%', height: '240px' }}>
                    <ResponsiveContainer>
                      <LineChart data={historyData.map(d => ({
                        time: new Date(d.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        latency: d.rttAvgMs,
                        throughput: d.throughputMbps,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} unit={selectedProfile.protocol === 'PING' ? ' ms' : ' Mbps'} />
                        <Tooltip 
                          contentStyle={{ background: '#0a0d16', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                          labelStyle={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                        {selectedProfile.protocol === 'PING' ? (
                          <Line type="monotone" dataKey="latency" name="Latency (ms)" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ) : (
                          <Line type="monotone" dataKey="throughput" name="Throughput (Mbps)" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Packet Loss & Jitter Line Chart */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Packet Loss & Jitter</h4>
                  <div style={{ width: '100%', height: '240px' }}>
                    <ResponsiveContainer>
                      <LineChart data={historyData.map(d => ({
                        time: new Date(d.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        loss: d.packetLossPct,
                        jitter: d.jitterMs
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0a0d16', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                          labelStyle={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                        <Line type="monotone" dataKey="loss" name="Packet Loss (%)" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 3 }} />
                        {selectedProfile.protocol === 'IPERF' && (
                          <Line type="monotone" dataKey="jitter" name="Jitter (ms)" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 3 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
