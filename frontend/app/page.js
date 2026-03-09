'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, joinSession } from '@/lib/api';

export default function LobbyPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  async function handleCreate() {
    if (!userName.trim()) { setError('Enter your name'); return; }
    setError('');
    setLoading(true);
    try {
      const { sessionId: sid } = await createSession();
      const { userId } = await joinSession(sid, userName.trim());
      router.push(`/game/${sid}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName.trim())}`);
    } catch (e) {
      setError(e.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!userName.trim() || !sessionId.trim()) { setError('Enter name and session ID'); return; }
    setError('');
    setLoading(true);
    try {
      const { userId, sessionId: sid } = await joinSession(sessionId.trim(), userName.trim());
      router.push(`/game/${sid}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName.trim())}`);
    } catch (e) {
      setError(e.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4 px-6 py-4 rounded-xl bg-white/10 border border-white/20">
            {logoError ? (
              <div className="h-16 flex items-center justify-center px-4 rounded-lg bg-[#00ed64]/20 text-[#00ed64] font-bold text-2xl">M</div>
            ) : (
              <img
                src="https://webimages.mongodb.com/_com_assets/cms/mongodb-logo-rgb-j6w271g1cn.svg"
                alt="MongoDB"
                className="h-16 w-auto min-h-[48px]"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="text-2xl font-bold text-white">MongoDB</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-white">Trade the News</h1>
        </div>
        <p className="text-center text-[var(--muted)] mb-4">Virtual ₹1,00,000 portfolio. NIFTY 50 stocks. News every 60s. Compete for best returns.</p>
        <p className="text-center text-xs text-[var(--muted)] mb-8 leading-relaxed">
          Powered by MongoDB: document model, Atlas Vector Search for semantic retrieval, real-time news ingestion, portfolio tracking, and AI agent memory — all in one platform.
        </p>

        <div className="flex rounded-lg bg-[var(--card)] border border-[var(--border)] p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'create' ? 'bg-[var(--accent)] text-black' : 'text-[var(--muted)] hover:text-white'}`}
          >
            Create game
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'join' ? 'bg-[var(--accent)] text-black' : 'text-[var(--muted)] hover:text-white'}`}
          >
            Join game
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Your name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Trader1"
              className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          {mode === 'join' && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Session ID</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
              />
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="button"
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className="mt-6 w-full py-3 rounded-lg bg-[var(--accent)] text-black font-semibold hover:bg-[var(--accent-dim)] disabled:opacity-50 transition"
        >
          {loading ? '...' : mode === 'create' ? 'Create & join' : 'Join game'}
        </button>
      </div>
    </div>
  );
}
