import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  Database,
  Server,
  Key,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import { authService, onRateLimitUpdate } from '../services/api';

// Fallback seed accounts if backend is temporarily unreachable
const DEFAULT_SEED_CREDENTIALS = [
  { id: 1, name: "Alex Morgan", email: "alex@example.com", password: "password123", role: "admin" },
  { id: 2, name: "Sarah Connor", email: "sarah@example.com", password: "terminator2024", role: "developer" },
  { id: 3, name: "David Miller", email: "david@example.com", password: "davidsecurepass", role: "developer" },
  { id: 4, name: "Elena Rostova", email: "elena@example.com", password: "elenapassword99", role: "security_analyst" },
  { id: 5, name: "James Wilson", email: "james@example.com", password: "wilsonPass!45", role: "developer" },
  { id: 6, name: "Maya Patel", email: "maya@example.com", password: "mayasecret2024", role: "qa_engineer" }
];

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [errorToast, setErrorToast] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Backend Integration & Seed Credentials State
  const [seedUsers, setSeedUsers] = useState(DEFAULT_SEED_CREDENTIALS);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, details: null });
  const [showAllCredentials, setShowAllCredentials] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch seed credentials and backend health from the integrated API
  useEffect(() => {
    let isMounted = true;

    async function checkBackendAndLoadSeeds() {
      try {
        const health = await authService.checkHealth();
        if (isMounted) {
          setBackendStatus({ online: true, checking: false, details: health });
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus({ online: false, checking: false, details: null });
        }
      }

      try {
        const seedData = await authService.getSeedCredentials();
        if (isMounted && seedData.credentials && seedData.credentials.length > 0) {
          setSeedUsers(seedData.credentials);
        }
      } catch (err) {
        console.warn('Using default seed credentials:', err);
      }
    }

    checkBackendAndLoadSeeds();
    return () => { isMounted = false; };
  }, []);

  // Rate limiter countdown
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          setErrorToast('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  // Subscribe to rate limit updates from API interceptors
  useEffect(() => {
    const unsub = onRateLimitUpdate((data) => {
      setRequestCount(prev => prev + 1);
      if (data.status === 429 && data.retryAfter) {
        setRetryCountdown(data.retryAfter);
        setErrorToast(`Too Many Requests. Retry after ${data.retryAfter} seconds.`);
      }
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (retryCountdown > 0) return;

    setIsLoading(true);
    setErrorToast('');

    try {
      const data = await authService.login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 429) {
        const retry = err.response.data?.retryAfter || 60;
        setRetryCountdown(retry);
        setErrorToast(`Too Many Requests. Retry after ${retry} seconds.`);
      } else if (err.response?.status === 423) {
        setErrorToast('Account locked due to too many failed attempts (Bug 6 feature).');
      } else {
        setErrorToast(err.response?.data?.error || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorToast('');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter seed users by role and search query
  const filteredUsers = seedUsers.filter(u => {
    const matchesRole = selectedRole === 'ALL' || u.role.toLowerCase() === selectedRole.toLowerCase();
    const query = searchFilter.toLowerCase().trim();
    const matchesSearch = !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const uniqueRoles = ['ALL', ...Array.from(new Set(seedUsers.map(u => u.role.toLowerCase())))];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-background space-y-6">
      <div className="w-full max-w-xl">
        {/* Backend Integration Status Banner */}
        <div className="flex items-center justify-between mb-4 px-4 py-2 rounded-xl bg-card border border-cardBorder text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 font-medium">Backend & Frontend Integration:</span>
          </div>
          {backendStatus.checking ? (
            <span className="flex items-center gap-1.5 text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting to API...
            </span>
          ) : backendStatus.online ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">
                Live & Integrated (/api on :5000)
              </span>
            </div>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> API Offline (Check dev server)
            </span>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">BugVault Playground</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in using any seed credential to test rate-limiting, JWTs, and access controls
          </p>
        </div>

        {/* Error / Rate Limit Toast */}
        {errorToast && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 transition-all ${
            retryCountdown > 0
              ? 'bg-red-950/40 border-danger text-red-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-danger" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {retryCountdown > 0 ? 'Rate Limit Exceeded' : 'Authentication Notice'}
              </p>
              <p className="text-xs mt-0.5 opacity-90">{errorToast}</p>
              {retryCountdown > 0 && (
                <div className="mt-2 text-xs font-mono font-semibold text-danger">
                  Cooldown active: {retryCountdown}s remaining
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorToast('')}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-card border border-cardBorder rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-900 border border-cardBorder rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-cardBorder rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: Passwords are intentionally checked in plain text before fixing Bug 4.
              </p>
            </div>

            {/* Rate limit status bar */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">API Requests Fired:</span>
              </div>
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {requestCount}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || retryCountdown > 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : retryCountdown > 0 ? (
                <span>Rate Limited ({retryCountdown}s)</span>
              ) : (
                <>
                  <span>Sign In to Playground</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Pick Seed Accounts */}
          <div className="mt-6 pt-5 border-t border-cardBorder">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Quick Seed Accounts
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {seedUsers.slice(0, 3).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickFill(u.email, u.password)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    email === u.email
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-cardBorder hover:border-blue-500/40 text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-white truncate">{u.name}</div>
                  <div className="text-[10px] text-blue-400 capitalize mt-0.5">{u.role.replace('_', ' ')}</div>
                </button>
              ))}
            </div>

            {/* Toggle Full Seed Credentials Vault */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAllCredentials(!showAllCredentials)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Seed Credentials Vault ({seedUsers.length} Users Available)</span>
                </div>
                {showAllCredentials ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Expandable Vault Panel */}
              {showAllCredentials && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-cardBorder space-y-3">
                  {/* Search and Role Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search name, email, role..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {uniqueRoles.slice(0, 4).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                            selectedRole.toLowerCase() === role.toLowerCase()
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seed Accounts List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{user.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize">
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                              {user.email} • Pass: <code className="text-amber-300">{user.password}</code>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(`${user.email} / ${user.password}`, user.id)}
                              title="Copy email and password"
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedId === user.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickFill(user.email, user.password)}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
                            >
                              Autofill
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-xs text-slate-500">
                        No seed credentials match your filter.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
