import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

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

  if (loading && users.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading user accounts...</span>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>User Management</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Admin controls to authorize operators, modify roles, and toggle access.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading} style={{ marginLeft: 'auto' }}>
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

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingUserId === u.id}
                        className="form-control"
                        style={{ 
                          width: 'auto', 
                          padding: '4px 10px', 
                          fontSize: '0.85rem',
                          background: 'rgba(10, 13, 22, 0.8)',
                          borderColor: 'var(--border-glass)'
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td>
                      <span 
                        className={`badge ${u.enabled ? 'badge-success' : 'badge-failed'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn ${u.enabled ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleToggleEnabled(u.id, u.enabled)}
                        disabled={updatingUserId === u.id}
                      >
                        {u.enabled ? 'Deactivate' : 'Activate'}
                      </button>
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

export default Users;
