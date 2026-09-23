import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, AlertCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { authService, onRateLimitUpdate } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [errorToast, setErrorToast] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);

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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">BugVault Login</h1>
          <p className="text-sm text-slate-400 mt-2">
            Authentication gateway protected by sliding window rate limiter
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
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
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
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
              <p className="text-[11px] text-slate-400 mt-1.5">
                Note: Passwords are intentionally checked in plain text (Bug 4).
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

          {/* Preset Test Credentials */}
          <div className="mt-6 pt-6 border-t border-cardBorder">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-3">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('alex@example.com', 'password123')}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-cardBorder hover:border-blue-500/40 text-left transition-colors"
              >
                <div className="font-medium text-slate-200">Alex Morgan</div>
                <div className="text-[11px] text-slate-400 font-mono">User ID: 1</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sarah@example.com', 'terminator2024')}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-cardBorder hover:border-blue-500/40 text-left transition-colors"
              >
                <div className="font-medium text-slate-200">Sarah Connor</div>
                <div className="text-[11px] text-slate-400 font-mono">User ID: 2</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
