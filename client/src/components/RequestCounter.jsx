import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Zap, RotateCcw } from 'lucide-react';
import api, { onRateLimitUpdate } from '../services/api';

export default function RequestCounter() {
  const [requests, setRequests] = useState([
    { id: 1, label: 'Request 1', status: 'Accepted', code: 200, time: 'Just now', note: 'Within quota' },
    { id: 2, label: 'Request 2', status: 'Accepted', code: 200, time: 'Just now', note: 'Within quota' },
    { id: 3, label: 'Request 3', status: 'Accepted', code: 200, time: 'Just now', note: 'Within quota' },
    { id: 4, label: 'Request 4', status: 'Accepted', code: 200, time: 'Just now', note: 'Within quota' },
    { id: 5, label: 'Request 5', status: 'Accepted', code: 200, time: 'Just now', note: 'Quota limit (5/5)' },
    { id: 6, label: 'Request 6', status: 'Accepted (Bug)', code: 200, time: 'Just now', note: '⚠️ Should be Blocked! Bug allows 6th request' }
  ]);

  const [remaining, setRemaining] = useState(0);
  const [windowSize] = useState(60); // 60 seconds
  const [blockedCount, setBlockedCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [liveBanner, setLiveBanner] = useState('');

  // Countdown timer for retry-after
  useEffect(() => {
    if (retryTimer <= 0) return;
    const interval = setInterval(() => {
      setRetryTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryTimer]);

  // Listen for real API rate limit headers from any API call
  useEffect(() => {
    const unsubscribe = onRateLimitUpdate((data) => {
      if (data.remaining !== null) {
        setRemaining(data.remaining);
      }
      if (data.status === 429) {
        setBlockedCount(prev => prev + 1);
        if (data.retryAfter) {
          setRetryTimer(data.retryAfter);
        }
      }
    });
    return unsubscribe;
  }, []);

  const sendSingleRequest = async () => {
    setIsSending(true);
    const reqNum = requests.length + 1;
    const now = new Date().toLocaleTimeString();

    try {
      const res = await api.post('/login', { email: 'probe@example.com', password: 'probe' });
      const remHeader = res.headers['x-ratelimit-remaining'];
      if (remHeader !== undefined) setRemaining(parseInt(remHeader, 10));

      const isBuggySix = reqNum === 6;
      setRequests(prev => [
        ...prev,
        {
          id: Date.now(),
          label: `Request ${reqNum}`,
          status: isBuggySix ? 'Accepted (Bug)' : 'Accepted',
          code: res.status,
          time: now,
          note: isBuggySix ? '⚠️ Should be Blocked! Bug allows 6th request' : 'HTTP 200 / 401 Received'
        }
      ]);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        const retry = err.response.data?.retryAfter || 60;
        setRetryTimer(retry);
        setBlockedCount(c => c + 1);
        setRequests(prev => [
          ...prev,
          {
            id: Date.now(),
            label: `Request ${reqNum}`,
            status: 'Blocked',
            code: 429,
            time: now,
            note: `HTTP 429 Too Many Requests. Retry after ${retry}s`
          }
        ]);
        setLiveBanner(`Too Many Requests. Retry after ${retry} seconds.`);
      } else {
        // Normal 401 (failed creds) is still an accepted request from rate-limiter perspective
        const isBuggySix = reqNum === 6;
        setRequests(prev => [
          ...prev,
          {
            id: Date.now(),
            label: `Request ${reqNum}`,
            status: isBuggySix ? 'Accepted (Bug)' : 'Accepted',
            code: err.response?.status || 200,
            time: now,
            note: isBuggySix ? '⚠️ Should be Blocked! Bug allows 6th request' : 'Request reached server'
          }
        ]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const burstSixRequests = async () => {
    setIsSending(true);
    setLiveBanner('Sending rapid burst of 6 requests to reproduce Bug 1...');
    for (let i = 0; i < 6; i++) {
      await sendSingleRequest();
    }
    setLiveBanner('Burst complete. Notice how Request 6 was accepted instead of returning HTTP 429!');
    setIsSending(false);
  };

  const resetTimeline = () => {
    setRequests([]);
    setBlockedCount(0);
    setRetryTimer(0);
    setRemaining(5);
    setLiveBanner('');
  };

  return (
    <div className="bg-card border border-cardBorder rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-cardBorder">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Sliding Window Rate Limiter Visualization</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitor tracking Sliding Window behavior (Target: 5 requests / 60 seconds)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={sendSingleRequest}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send Request</span>
          </button>
          <button
            onClick={burstSixRequests}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Burst 6 Requests</span>
          </button>
          <button
            onClick={resetTimeline}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Reset Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner if present */}
      {liveBanner && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
          <span>{liveBanner}</span>
          <button onClick={() => setLiveBanner('')} className="text-slate-400 hover:text-white text-xs ml-2">✕</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Remaining Requests */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Remaining Requests</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-white">{remaining}</span>
            <span className="text-xs text-slate-400 font-mono">/ 5</span>
          </div>
        </div>

        {/* Window Size */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Window Size</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-blue-400">{windowSize}</span>
            <span className="text-xs text-slate-400">seconds</span>
          </div>
        </div>

        {/* Blocked Requests */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Blocked (429)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-danger">{blockedCount}</span>
            <span className="text-xs text-slate-400">requests</span>
          </div>
        </div>

        {/* Retry Timer */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Retry Timer</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={`text-2xl font-bold font-mono ${retryTimer > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              {retryTimer > 0 ? `${retryTimer}s` : '0s'}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Limit Visualization Timeline */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Request Timeline</h3>
          <span className="text-xs text-slate-400 font-mono">Showing {requests.length} entries</span>
        </div>

        <div className="space-y-2">
          {requests.map((req, idx) => {
            const isAccepted = req.status.startsWith('Accepted');
            const isBuggy = req.status.includes('Bug');
            const isBlocked = req.status === 'Blocked';

            return (
              <div
                key={req.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                  isBuggy
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : isBlocked
                    ? 'bg-red-950/20 border-red-500/30 text-red-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isBuggy ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : isBlocked ? (
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  )}

                  <span className="font-mono font-semibold text-slate-100">{req.label}</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">{req.note}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                      isBuggy
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isBlocked
                        ? 'bg-red-500/20 text-danger border border-red-500/30'
                        : 'bg-emerald-500/20 text-success border border-emerald-500/30'
                    }`}
                  >
                    {isBuggy ? 'Should be Blocked → Accepted' : req.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden md:inline">{req.time}</span>
                </div>
              </div>
            );
          })}

          {requests.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No requests sent yet. Click "Send Request" or "Burst 6 Requests" above to start testing!
            </div>
          )}
        </div>
      </div>

      {/* Developer Insight callout */}
      <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Bug 1 Developer Insight:</span> In a proper sliding window implementation with a 5 req/60s limit, Request 6 should be blocked with HTTP 429. Here, the timestamp is added before validation and the condition checks <code className="text-blue-300 font-mono">length &gt; 6</code> instead of <code className="text-blue-300 font-mono">length &gt;= 5</code>, allowing Request 6 to succeed!
        </div>
      </div>
    </div>
  );
}
