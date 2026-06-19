import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they tried to access before log in, or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', minHeight: '82vh', alignItems: 'center', justifyContent: 'space-between', gap: '60px', padding: '60px 20px', flexWrap: 'wrap' }}>
      
      {/* Left Column - Application Identity */}
      <div style={{ flex: '1 1 480px', minWidth: '320px', paddingRight: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <svg 
            width="44" 
            height="44" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--color-primary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span style={{ fontSize: '1.65rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.04em' }}>
            Test Portal 2026
          </span>
        </div>
        
        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.18', marginBottom: '22px', letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Distributed Network Performance Diagnostics.
        </h1>
        
        <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: '1.68', marginBottom: '34px', maxWidth: '520px' }}>
          Orchestrate remote ICMP latency, path hops, and bandwidth throughput jobs across multiple subnets. Inspect live streaming terminals and set up Slack or Discord notifications for immediate outage response.
        </p>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 28px', fontSize: '0.92rem', borderRadius: 'var(--radius-sm)' }}
        >
          Know More
        </button>
      </div>

      {/* Right Column - Translucent Glass Login Block */}
      <div 
        className="glass-panel" 
        style={{ 
          flex: '0 1 420px', 
          width: '100%',
          minWidth: '320px',
          padding: '40px',
          background: 'rgba(12, 17, 34, 0.4)', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div style={{ marginBottom: '32px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontWeight: '700' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sign in to start orchestrating diagnostics.
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '12px', 
              backgroundColor: 'var(--color-danger-glass)', 
              color: 'var(--color-danger)', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Username</label>
            <input 
              type="text" 
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              disabled={submitting}
              autoComplete="username"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Password</label>
            <input 
              type="password" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="current-password"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
            Create Account
          </Link>
        </div>
      </div>

      {/* Dynamic Know More Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(4, 6, 12, 0.88)',
            backdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              position: 'relative',
              background: '#0a0d16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '40px',
              animation: 'modalSlideIn 0.4s var(--ease-human)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
              About Network Test Portal
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.62' }}>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '6px', fontSize: '1rem' }}>🤔 Why this App?</h4>
                <p style={{ margin: 0 }}>
                  Network diagnostic tools are typically fragmented, command-line interfaces running locally on a single administrator machine. This portal transforms CLI testing into a centralized orchestrator system, capable of scheduling and executing remote diagnostic jobs across distributed subnets and presenting the metrics visually in one dashboard.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#fff', marginBottom: '6px', fontSize: '1rem' }}>🚀 What does it do?</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>Centralized Test Profiling:</strong> Manage targets and parameters dynamically for recurring diagnostic tests.</li>
                  <li><strong>Interactive Live Streams:</strong> Probe systems on demand and read terminal outputs instantly via Server-Sent Events (SSE).</li>
                  <li><strong>Automated Channel Alerting:</strong> Scan results against critical thresholds and dispatch Discord or Slack alerts during latency spikes or package drops.</li>
                  <li><strong>Subnet Monitoring Agents:</strong> Deploy remote python-clients that auto-discover targets and report telemetry results back to the portal.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#fff', marginBottom: '6px', fontSize: '1rem' }}>💻 Technology Stack</h4>
                <p style={{ margin: 0 }}>
                  Built with a modern web tech stack including a **Java 17 & Spring Boot** secure API backend, a **React & Vite** glassmorphic dashboard frontend, **PostgreSQL** for relational metadata persistence, and standard **Python 3** subprocess binaries for local executing workers.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
