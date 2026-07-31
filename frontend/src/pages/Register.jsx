import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required.');
      return;
    }

    // Username: 3 to 20 chars, alphanumeric + underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, or underscores.');
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password complexity: >= 6 chars, 1 upper, 1 lower, 1 digit
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one digit.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      // All registrations strictly default to VIEWER on the backend to avoid privilege escalation
      await register(username, email, password, 'VIEWER');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username/email.');
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
      </div>

      {/* Right Column - Translucent Glass Registration Block */}
      <div 
        className="glass-panel" 
        style={{ 
          flex: '0 1 450px', 
          width: '100%',
          minWidth: '320px',
          padding: '40px',
          background: 'rgba(12, 17, 34, 0.4)', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', fontWeight: '700' }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Register to join the monitoring dashboard.
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
              placeholder="e.g. operator_john"
              disabled={submitting}
              autoComplete="username"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
            <input 
              type="email" 
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={submitting}
              autoComplete="email"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Password</label>
            <input 
              type="password" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 chars (A-Z, a-z, 0-9)"
              disabled={submitting}
              autoComplete="new-password"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm Password</label>
            <input 
              type="password" 
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              disabled={submitting}
              autoComplete="new-password"
              style={{ background: 'rgba(6, 9, 19, 0.65)' }}
            />
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '24px' }}>
            ℹ️ New registrations default to the <strong>VIEWER</strong> role. Contact an Administrator to request elevation to <strong>OPERATOR</strong> or <strong>ADMIN</strong>.
          </p>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Creating account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Register;
