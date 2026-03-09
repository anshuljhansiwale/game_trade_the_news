const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Format number as INR (Indian numbering: 1,00,000) */
export function formatINR(num, options = {}) {
  const { maxFractionDigits = 0, minFractionDigits } = options;
  return `₹${Number(num).toLocaleString('en-IN', { maximumFractionDigits: maxFractionDigits ?? 0, minimumFractionDigits: minFractionDigits })}`;
}

export async function getSymbols() {
  const res = await fetch(`${API}/api/portfolio/symbols`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createSession() {
  const res = await fetch(`${API}/api/sessions/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function joinSession(sessionId, userName) {
  const sid = String(sessionId || '').trim().toLowerCase();
  const res = await fetch(`${API}/api/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sid, userName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${API}/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLeaderboard(sessionId) {
  const res = await fetch(`${API}/api/sessions/${sessionId}/leaderboard`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPortfolio(sessionId, userId) {
  const res = await fetch(`${API}/api/portfolio/${sessionId}/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function placeOrder(sessionId, userId, symbol, side, qty) {
  const res = await fetch(`${API}/api/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId, symbol, side, qty }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || await res.text());
  }
  return res.json();
}

export async function getTrades(sessionId, userId) {
  const res = await fetch(`${API}/api/trades/${sessionId}/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLatestNews(sessionId) {
  const res = await fetch(`${API}/api/news/latest/${sessionId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNewsHistory(sessionId, limit = 10) {
  const res = await fetch(`${API}/api/news/history/${sessionId}?limit=${limit}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAgentAnalysis(eventId, userId, sessionId) {
  const res = await fetch(`${API}/api/agent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, userId, sessionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
