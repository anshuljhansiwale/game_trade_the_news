import { getDb } from '../db.js';
import { getEmbedding } from './embeddings.js';
import { NEXT_EVENT_INTERVAL_MS } from '../config.js';
import { NIFTY50_SYMBOLS } from '../constants/nifty50.js';

const CATEGORIES = [
  { id: 'earnings', label: 'Earnings Surprise', tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATASTEEL', 'TATAMOTORS', 'HINDUNILVR'], sentiments: ['beat', 'miss'] },
  { id: 'geopolitical', label: 'Geopolitical Event', tickers: ['RELIANCE', 'ONGC', 'BPCL', 'COALINDIA', 'HINDALCO', 'JSWSTEEL', 'BHARTIARTL', 'ITC'], sentiments: ['risk-on', 'risk-off'] },
  { id: 'rates', label: 'Rate Decision', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE', 'RELIANCE', 'LT'], sentiments: ['hawkish', 'dovish'] },
];

const TEMPLATES = {
  earnings: {
    beat: [
      { headline: 'Reliance Industries beats Q3 estimates; retail and Jio drive growth', body: 'Revenue above consensus. Management raised full-year guidance; oil-to-chemicals and digital segments strong.' },
      { headline: 'TCS reports earnings beat on strong deal pipeline', body: 'IT major tops street estimates. North America and BFSI verticals lead; attrition eases.' },
      { headline: 'HDFC Bank quarterly profit beats estimates', body: 'Net interest income and loan growth above expectations. Asset quality stable.' },
    ],
    miss: [
      { headline: 'IT major misses earnings; cites client spending cuts', body: 'Revenue and margins below consensus. Company lowered full-year revenue guidance.' },
      { headline: 'Auto major reports earnings miss on weak rural demand', body: 'Volume and margin pressure. Management flags cautious outlook for coming quarter.' },
      { headline: 'Bank quarterly profit misses on higher provisions', body: 'NII in line but provisions weigh. Slippages from one large account.' },
    ],
  },
  geopolitical: {
    'risk-on': [
      { headline: 'Trade tensions ease; Nifty extends gains', body: 'New framework announced. Risk assets gain; banks and metals lead.' },
      { headline: 'Ceasefire talks progress; indices rise', body: 'Investors shift to risk-on. Commodities and equities advance; FII buying continues.' },
    ],
    'risk-off': [
      { headline: 'Escalation in region sends investors to safe havens', body: 'Gold and bonds rally. Nifty declines; IT and pharma relatively resilient.' },
      { headline: 'Supply chain disruption fears grow', body: 'Commodity prices spike; auto and industrials underperform.' },
    ],
  },
  rates: {
    hawkish: [
      { headline: 'RBI holds repo rate; signals prolonged pause', body: 'Inflation still above target. MPC keeps stance withdrawal of accommodation; bond yields rise.' },
      { headline: 'RBI keeps rates unchanged; inflation focus stays', body: 'No change in repo or stance. Markets price delayed rate cuts; bank stocks mixed.' },
    ],
    dovish: [
      { headline: 'RBI holds rates; hints at easing if inflation eases', body: 'Inflation cooling. Markets price possible cut in second half; equities and bonds rally.' },
      { headline: 'RBI keeps policy rate unchanged; growth focus', body: 'Growth concerns cited. Bond yields dip; rate-sensitive sectors gain.' },
    ],
  },
};

let simulationInterval = null;
let activeSessionId = null;

export function startSimulation(sessionId) {
  stopSimulation();
  activeSessionId = sessionId;
  setTimeout(() => emitNextEvent(sessionId), 10_000);
  simulationInterval = setInterval(() => emitNextEvent(sessionId), NEXT_EVENT_INTERVAL_MS);
}

export function stopSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  simulationInterval = null;
  activeSessionId = null;
}

export function getActiveSessionId() {
  return activeSessionId;
}

async function emitNextEvent(sessionId) {
  const db = getDb();
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const sentiment = category.sentiments[Math.floor(Math.random() * category.sentiments.length)];
  const templates = TEMPLATES[category.id][sentiment];
  const t = templates[Math.floor(Math.random() * templates.length)];
  const tickers = [...category.tickers].sort(() => Math.random() - 0.5).slice(0, 3);
  const textForEmbedding = `${t.headline} ${t.body} ${category.label} ${sentiment} ${tickers.join(' ')}`;
  const embedding = await getEmbedding(textForEmbedding);

  const doc = {
    sessionId,
    headline: t.headline,
    body: t.body,
    category: category.id,
    categoryLabel: category.label,
    sentiment,
    tickers,
    publishedAt: new Date(),
    embedding: embedding || undefined,
  };
  const result = await db.collection('news_events').insertOne(doc);

  await db.collection('game_sessions').updateOne(
    { sessionId },
    { $set: { currentNewsEventId: result.insertedId.toString(), lastEventAt: new Date() } }
  );

  return { eventId: result.insertedId.toString(), headline: t.headline };
}
