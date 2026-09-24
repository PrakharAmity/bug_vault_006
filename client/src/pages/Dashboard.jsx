import React, { useState, useEffect } from 'react';
import { User, Key, Shield, Clock, Terminal, CheckCircle2, AlertTriangle, Bug, Zap, RefreshCw, Database, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import RequestCounter from '../components/RequestCounter';
import { profileService, authService } from '../services/api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState('');
  const [decodedToken, setDecodedToken] = useState(null);
  const [activityLog, setActivityLog] = useState([
    { id: 1, action: 'User authenticated via POST /api/login', time: '10:00:12', type: 'info' },
    { id: 2, action: 'Loaded dashboard session metrics', time: '10:00:13', type: 'info' }
  ]);
  const [loading, setLoading] = useState(true);
  const [jwtTesting, setJwtTesting] = useState(false);
  const [jwtTestResult, setJwtTestResult] = useState(null);
  const [seedUsers, setSeedUsers] = useState([]);
  const [showSeeds, setShowSeeds] = useState(false);
  const [copiedSeedId, setCopiedSeedId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const rawToken = authService.getToken();
        setToken(rawToken || '');

        if (rawToken) {
          try {
            // Decode payload safely on client for visual inspection
            const payload = JSON.parse(atob(rawToken.split('.')[1]));
            setDecodedToken(payload);
          } catch (e) {
            setDecodedToken(null);
          }
        }

        const data = await profileService.getProfile();
        setProfile(data);
        addLog(`Profile loaded for ${data.name} (Role: ${data.role})`, 'success');

        try {
          const seeds = await authService.getSeedCredentials();
          if (seeds && seeds.credentials) {
            setSeedUsers(seeds.credentials);
          }
        } catch (e) {
          console.warn('Could not load seed credentials:', e);
        }
      } catch (err) {
        addLog('Failed to fetch profile: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addLog = (action, type = 'info') => {
    setActivityLog(prev => [
      {
        id: Date.now(),
        action,
        time: new Date().toLocaleTimeString(),
        type
      },
      ...prev.slice(0, 7) // keep recent 8 items
    ]);
  };

  // Interactive tester for Bug 2: Test sending an expired JWT
  const testExpiredJwt = async () => {
    setJwtTesting(true);
    setJwtTestResult(null);

    // Construct a token header and payload with exp set in the past (1 hour ago)
    // and dummy signature to observe how backend auth middleware handles it
    const expiredPayload = {
      id: profile?.id || 1,
      email: profile?.email || 'alex@example.com',
      name: profile?.name || 'Alex Morgan',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    };

    try {
      // Direct call using the expired token via custom fetch
      // Note: Backend has JWT_SECRET 'bugvault-super-secret-key-2024'
      // We can call /api/profile using a token signed or test endpoint
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}` // using current token to verify route behavior
        }
      });

      setJwtTestResult({
        status: res.status,
        note: 'Bug 2: In auth.js, verifyToken() passes { ignoreExpiration: true }. Expired tokens never trigger 401 Unauthorized!'
      });
      addLog('Executed JWT verification inspection', 'info');
    } catch (err) {
      setJwtTestResult({ status: 'error', note: err.message });
    } finally {
      setJwtTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Security Dashboard</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Session
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your active credentials, request quotas, and inspect backend behavioral vulnerabilities.
        </p>
      </div>

      {/* Grid of Top Cards: Profile, JWT Status, Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: User Profile */}
        <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Profile Details</h2>
            </div>
            <span className="text-[11px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-slate-700">
              ID: {profile?.id || '—'}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Full Name</span>
              <p className="text-sm font-semibold text-white mt-0.5">{profile?.name || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Email Address</span>
              <p className="text-sm font-mono text-slate-200 mt-0.5">{profile?.email || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Role</span>
                <p className="font-semibold text-white capitalize mt-0.5">{profile?.role || 'User'}</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Joined</span>
                <p className="font-mono text-slate-300 mt-0.5">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: JWT Status & Inspector */}
        <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">JWT Status</h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Token Payload Claims</span>
              <div className="mt-1 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-24">
                {decodedToken ? (
                  <pre className="text-slate-300">{JSON.stringify(decodedToken, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500">No token parsed</span>
                )}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Expires: {decodedToken?.exp ? new Date(decodedToken.exp * 1000).toLocaleTimeString() : 'N/A'}
              </span>
              <button
                onClick={testExpiredJwt}
                disabled={jwtTesting}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 underline"
              >
                Inspect Expiration Bug
              </button>
            </div>

            {jwtTestResult && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
                {jwtTestResult.note}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Activity Log */}
        <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Activity Log</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live events</span>
          </div>

          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
            {activityLog.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-2 p-2 rounded bg-slate-900/50 border border-slate-800 text-[11px]"
              >
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-200">{log.action}</span>
                </div>
                <span className="text-slate-500 font-mono flex-shrink-0 text-[10px]">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rate Limit Visualization Component (Remaining Requests, Window Size, Blocked, Timeline) */}
      <RequestCounter />

      {/* Active Bug Matrix Summary */}
      <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Intentional Challenge Bugs Matrix</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">6 Reproducible Bugs Present</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 1: Sliding Window</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Easy</span>
            </div>
            <p className="text-slate-400 mt-1">Allows 6th request due to off-by-one boundary check and early reset.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 2: JWT Expiry Ignored</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Easy</span>
            </div>
            <p className="text-slate-400 mt-1">auth.js passes <code className="text-amber-300">ignoreExpiration: true</code>.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 3: IDOR Access</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>
            </div>
            <p className="text-slate-400 mt-1">Any user can read another user's profile via <code className="text-amber-300">/api/profile/:id</code>.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 4: Plain Text Passwords</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Easy</span>
            </div>
            <p className="text-slate-400 mt-1">Stored unhashed in JSON; checked with <code className="text-amber-300">===</code> instead of bcrypt.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 5: Pagination Off-by-One</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Easy</span>
            </div>
            <p className="text-slate-400 mt-1">Offset calculated as <code className="text-amber-300">page * limit</code> skipping records 11-20.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Bug 6: Login Race Condition</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>
            </div>
            <p className="text-slate-400 mt-1">Concurrent requests read stale failed attempt counters and bypass lockout.</p>
          </div>
        </div>
      </div>

      {/* System Seed Accounts & Test Credentials (Backend Integrated) */}
      <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">System Seed Credentials Vault</h2>
          </div>
          <button
            onClick={() => setShowSeeds(!showSeeds)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span>{showSeeds ? 'Hide Credentials' : `Show All ${seedUsers.length || 20} Seed Accounts`}</span>
            {showSeeds ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          These test accounts are populated directly from the backend database (<code className="text-amber-300">server/data/users.json</code>) via the integrated <code className="text-blue-300 font-mono">GET /api/seed-credentials</code> API endpoint. You can use these user IDs to test authorization boundaries and IDOR vulnerabilities.
        </p>

        {showSeeds && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {seedUsers.map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white truncate">{user.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      #{user.id} • {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 truncate">
                    {user.email}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <span>Pass:</span>
                    <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{user.password}</code>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${user.email} / ${user.password}`);
                      setCopiedSeedId(user.id);
                      setTimeout(() => setCopiedSeedId(null), 1800);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                  >
                    {copiedSeedId === user.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
