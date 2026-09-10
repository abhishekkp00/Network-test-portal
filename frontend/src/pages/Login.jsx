import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Info, LogIn, X } from 'lucide-react';
import { NocPanel, RetroButton, StatusIndicator } from '../components/common';

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
    <div className="container flex items-center justify-center min-h-[85vh] py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Column - System Identity & Information */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#00ff66] bg-[#00ff66]/10 px-2 py-1 border border-[#00ff66]/30 rounded-[2px] tracking-widest uppercase">
              // SYS.NOC.v2026
            </span>
            <StatusIndicator status="ONLINE" text="NOC ONLINE" />
          </div>

          <h1 className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-[#d5e3d8] uppercase border-l-2 border-[#00ff66] pl-4">
            Distributed Network Performance Diagnostics
          </h1>

          <p className="font-mono text-xs md:text-sm text-[#768a7b] leading-relaxed max-w-xl">
            Orchestrate remote ICMP latency probes, path hop analysis, and throughput diagnostic jobs across multi-subnet infrastructure. Real-time telemetry via server-sent streams and alert deduplication.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <RetroButton 
              variant="secondary" 
              icon={Info} 
              onClick={() => setShowModal(true)}
            >
              System Specs & Info
            </RetroButton>
          </div>
        </div>

        {/* Right Column - NOC Authentication Terminal */}
        <div className="md:col-span-5">
          <NocPanel
            code="AUTH // 0x01"
            title="AUTHENTICATION TERMINAL"
            badge={<StatusIndicator status="ACTIVE" text="SECURE" />}
          >
            <div className="mb-4 text-xs font-mono text-[#768a7b]">
              Enter system operator credentials to access the terminal console.
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-[#ff3333]/15 border border-[#ff3333]/40 rounded-[2px] font-mono text-xs text-[#ff3333] flex items-start gap-2">
                <span className="font-bold shrink-0">[ERR]</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">OPERATOR USERNAME</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">OPERATOR PASSWORD</label>
                <input 
                  type="password" 
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  autoComplete="current-password"
                />
              </div>

              <RetroButton 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg"
                disabled={submitting}
                icon={LogIn}
              >
                {submitting ? 'AUTHENTICATING...' : 'SIGN IN TO NOC'}
              </RetroButton>
            </form>

            <div className="mt-4 pt-3 border-t border-[#27342a] text-center font-mono text-xs text-[#768a7b]">
              New Operator?{' '}
              <Link to="/register" className="text-[#00ff66] hover:underline font-semibold">
                Register Credentials
              </Link>
            </div>
          </NocPanel>
        </div>
      </div>

      {/* System Information Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-[#0a0d0b]/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NocPanel
              code="SYS.DOCS // 0x99"
              title="System Specification & Architecture"
              action={
                <RetroButton variant="ghost" size="sm" onClick={() => setShowModal(false)} icon={X}>
                  Close
                </RetroButton>
              }
            >
              <div className="space-y-4 font-mono text-xs text-[#768a7b] leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-[#d5e3d8] font-bold text-sm mb-1 uppercase">// Architecture Purpose</h4>
                  <p>
                    Network diagnostic tools are typically fragmented CLI tools running locally on administrator machines. This portal consolidates ICMP latency probes, tracepaths, and throughput diagnostics into a production-grade distributed execution platform.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#d5e3d8] font-bold text-sm mb-1 uppercase">// Core Telemetry Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#d5e3d8]">
                    <li><strong className="text-[#00ff66]">Atomic Job Claiming:</strong> Row-level PostgreSQL locks (SELECT FOR UPDATE SKIP LOCKED) ensure concurrency safety across polling agents.</li>
                    <li><strong className="text-[#00ff66]">Live Diagnostic SSE:</strong> Stream binary outputs in real time via Server-Sent Events.</li>
                    <li><strong className="text-[#00ff66]">Incident Lifecycle & Alerts:</strong> Track alert deduplication, state transitions, and automated resolution.</li>
                    <li><strong className="text-[#00ff66]">HMAC Signed Agent Telemetry:</strong> Cryptographic token hashing and HMAC request signatures.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[#d5e3d8] font-bold text-sm mb-1 uppercase">// Technology Stack</h4>
                  <p>
                    Backend: Java 17, Spring Boot 3, Spring Security, PostgreSQL 15.<br/>
                    Frontend: React 19, Vite, Tailwind CSS, Lucide React icons.<br/>
                    Agents: Python 3 socket / subprocess workers.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#27342a] text-right">
                <RetroButton variant="primary" onClick={() => setShowModal(false)}>
                  Acknowledge
                </RetroButton>
              </div>
            </NocPanel>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
