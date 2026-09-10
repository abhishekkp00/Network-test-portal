import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { RotateCw, Users as UsersIcon, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator, SectionHeader, MetricReadout } from '../components/common';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleEnabled = async (userId, currentStatus) => {
    setUpdatingUserId(userId);
    try {
      const updatedUser = await api.patch(`/users/${userId}/enabled`, {
        enabled: !currentStatus
      });
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const updatedUser = await api.patch(`/users/${userId}/role`, {
        role: newRole
      });
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
      // Refresh to revert UI select value to correct state
      fetchUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const operatorCount = users.filter(u => u.role === 'OPERATOR').length;
  const viewerCount = users.filter(u => u.role === 'VIEWER').length;

  if (loading && users.length === 0) {
    return (
      <div className="container flex justify-center items-center h-[60vh] font-mono text-xs text-[#768a7b]">
        <span>[SYS.INFO] Loading user credentials...</span>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <SectionHeader
        code="SYS_USER_MGMT"
        title="Operator User Management"
        subtitle="Manage access roles, permissions, and account activation states"
        actions={
          <RetroButton variant="secondary" icon={RotateCw} onClick={fetchUsers} disabled={loading}>
            Refresh Users
          </RetroButton>
        }
      />

      {error && (
        <div className="p-3 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-center gap-2">
          <span className="font-bold">[ERR]</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Readout Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricReadout label="TOTAL USERS" value={users.length} status="neutral" icon={UsersIcon} />
        <MetricReadout label="ADMINS" value={adminCount} status="red" icon={ShieldAlert} />
        <MetricReadout label="OPERATORS" value={operatorCount} status="cyan" icon={UsersIcon} />
        <MetricReadout label="VIEWERS" value={viewerCount} status="neutral" icon={UsersIcon} />
      </div>

      <NocPanel code="USER_ACCOUNTS" title="Registered User Accounts" noPadding>
        <div className="table-container border-0 rounded-none">
          <table className="custom-table">
            <thead>
              <tr>
                <th>OPERATOR USERNAME</th>
                <th>EMAIL ADDRESS</th>
                <th>ACCESS ROLE</th>
                <th>STATUS</th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#768a7b]">
                    No user accounts found in database.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-bold text-[#d5e3d8]">{u.username}</td>
                    <td className="text-[#768a7b]">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingUserId === u.id}
                        className="form-control py-1 px-2 text-xs w-auto bg-[#101411]"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td>
                      <StatusIndicator status={u.enabled ? 'ACTIVE' : 'OFFLINE'} text={u.enabled ? 'ACTIVE' : 'DISABLED'} />
                    </td>
                    <td className="text-right">
                      <RetroButton
                        variant={u.enabled ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleEnabled(u.id, u.enabled)}
                        disabled={updatingUserId === u.id}
                      >
                        {u.enabled ? 'Deactivate' : 'Activate'}
                      </RetroButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NocPanel>
    </div>
  );
};

export default Users;
