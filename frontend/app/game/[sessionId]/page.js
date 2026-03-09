'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getLatestNews,
  getNewsHistory,
  getPortfolio,
  getLeaderboard,
  getAgentAnalysis,
  placeOrder,
  getTrades,
} from '@/lib/api';
import Countdown from '@/components/Countdown';
import NewsFeed from '@/components/NewsFeed';
import AgentPanel from '@/components/AgentPanel';
import Portfolio from '@/components/Portfolio';
import TradeForm from '@/components/TradeForm';
import Leaderboard from '@/components/Leaderboard';

const POLL_MS = 5000;
const COUNTDOWN_SECONDS = 60;

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName') || 'You';

  const [portfolio, setPortfolio] = useState(null);
  const [prices, setPrices] = useState({});
  const [latestNews, setLatestNews] = useState(null);
  const [newsHistory, setNewsHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trades, setTrades] = useState([]);
  const [agentResult, setAgentResult] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [error, setError] = useState('');
  const [nextEventAt, setNextEventAt] = useState(null);

  const loadPortfolio = useCallback(async () => {
    if (!sessionId || !userId) return;
    try {
      const { portfolio: p, prices: pr } = await getPortfolio(sessionId, userId);
      setPortfolio(p);
      setPrices(pr || {});
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId, userId]);

  const loadNews = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [latest, history] = await Promise.all([
        getLatestNews(sessionId),
        getNewsHistory(sessionId, 5),
      ]);
      setLatestNews(latest);
      setNewsHistory(history || []);
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId]);

  const loadLeaderboard = useCallback(async () => {
    if (!sessionId) return;
    try {
      const list = await getLeaderboard(sessionId);
      setLeaderboard(list || []);
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId]);

  const loadTrades = useCallback(async () => {
    if (!sessionId || !userId) return;
    try {
      const list = await getTrades(sessionId, userId);
      setTrades(list || []);
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;
    loadPortfolio();
    loadNews();
    loadLeaderboard();
    loadTrades();
    const t = setInterval(() => {
      loadPortfolio();
      loadNews();
      loadLeaderboard();
      loadTrades();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [sessionId, userId, loadPortfolio, loadNews, loadLeaderboard, loadTrades]);

  useEffect(() => {
    if (!latestNews?.publishedAt) return;
    const published = new Date(latestNews.publishedAt).getTime();
    setNextEventAt(published + COUNTDOWN_SECONDS * 1000);
  }, [latestNews]);

  async function handleAnalyze() {
    if (!latestNews?.id || !userId || !sessionId) return;
    setLoadingAgent(true);
    setAgentResult(null);
    try {
      const result = await getAgentAnalysis(latestNews.id, userId, sessionId);
      setAgentResult(result);
    } catch (e) {
      setAgentResult({ analysis: `Error: ${e.message}`, suggestedTrades: [] });
    } finally {
      setLoadingAgent(false);
    }
  }

  async function handleOrder(symbol, side, qty) {
    setError('');
    try {
      const { portfolio: p } = await placeOrder(sessionId, userId, symbol, side, qty);
      setPortfolio(p);
      await loadLeaderboard();
      await loadTrades();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-[var(--muted)]">Missing user. <Link href="/" className="text-[var(--accent)] underline">Go to lobby</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[var(--muted)] hover:text-white text-sm">← Lobby</Link>
          <h1 className="text-xl font-bold text-white">Trade the News</h1>
          <span className="text-sm text-[var(--muted)]">Session: <span className="font-mono text-white">{sessionId}</span></span>
          <span className="text-sm text-[var(--muted)]">{userName}</span>
        </div>
        {nextEventAt && <Countdown targetMs={nextEventAt} intervalMs={1000} />}
      </header>

      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NewsFeed latest={latestNews} history={newsHistory} />
          <AgentPanel
            latestNews={latestNews}
            agentResult={agentResult}
            loading={loadingAgent}
            onAnalyze={handleAnalyze}
          />
        </div>
        <div className="space-y-6">
          <Portfolio portfolio={portfolio} prices={prices} />
          <TradeForm portfolio={portfolio} prices={prices} onOrder={handleOrder} />
          <Leaderboard leaderboard={leaderboard} currentUserId={userId} />
        </div>
      </div>
    </div>
  );
}
