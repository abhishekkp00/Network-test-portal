import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Info } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator } from '../components/common';

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
    <div className="container flex items-center justify-center min-h-[85vh] py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Column - Identity */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#00ff66] bg-[#00ff66]/10 px-2 py-1 border border-[#00ff66]/30 rounded-[2px] tracking-widest uppercase">
              // OPERATOR REGISTRATION
            </span>
            <StatusIndicator status="ACTIVE" text="INITIALIZE" />
          </div>

          <h1 className="font-mono text-3xl font-bold tracking-tight text-[#d5e3d8] uppercase border-l-2 border-[#00ff66] pl-4">
            Provision Telemetry Access Credentials
          </h1>

          <p className="font-mono text-xs text-[#768a7b] leading-relaxed">
            Register new operator account to inspect live NOC diagnostic streams, view subnet topology telemetry, and submit scheduled network testing profiles.
          </p>

          <div className="p-3 bg-[#101411] border border-[#27342a] rounded-[2px] font-mono text-xs text-[#768a7b] space-y-1">
            <div className="text-[#00ff66] font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>ROLE PROVISIONING NOTICE</span>
            </div>
            <div>
              New registrations default strictly to <strong className="text-[#d5e3d8]">[VIEWER]</strong> access level. Role upgrades to <strong className="text-[#d5e3d8]">[OPERATOR]</strong> or <strong className="text-[#d5e3d8]">[ADMIN]</strong> require approval.
            </div>
          </div>
        </div>

        {/* Right Column - Registration Panel */}
        <div className="md:col-span-6">
          <NocPanel
            code="SYS.REG // 0x02"
            title="NEW OPERATOR REGISTRATION"
            badge={<StatusIndicator status="PENDING" text="NEW RECORD" />}
          >
            {error && (
              <div className="mb-4 p-2.5 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-start gap-2">
                <span className="font-bold shrink-0">[ERR]</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="form-group">
                <label className="form-label">OPERATOR USERNAME</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="operator_name"
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@company.net"
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CONFIRM PASSWORD</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <RetroButton 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg"
                disabled={submitting}
                icon={UserPlus}
              >
                {submitting ? 'REGISTERING ACCOUNT...' : 'PROVISION OPERATOR ACCOUNT'}
              </RetroButton>
            </form>

            <div className="mt-4 pt-3 border-t border-[#27342a] text-center font-mono text-xs text-[#768a7b]">
              Already Registered?{' '}
              <Link to="/login" className="text-[#00ff66] hover:underline font-semibold">
                Sign In To NOC
              </Link>
            </div>
          </NocPanel>
        </div>

      </div>
    </div>
  );
};

export default Register;
