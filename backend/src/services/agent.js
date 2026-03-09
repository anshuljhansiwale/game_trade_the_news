import OpenAI from 'openai';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { getOrCreatePortfolio } from './portfolio.js';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function findHistoricalAnalogues(embedding, limit = 5) {
  const db = getDb();
  try {
    const cursor = db.collection('historical_news').aggregate([
      {
        $vectorSearch: {
          index: 'historical_news_vector',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 50,
          limit,
        },
      },
      { $project: { headline: 1, body: 1, category: 1, sentiment: 1, tickers: 1, score: { $meta: 'vectorSearchScore' } } },
    ]);
    return await cursor.toArray();
  } catch (e) {
    if (e.code === 267 || e.message?.includes('vector')) {
      const fallback = await db.collection('historical_news').find({}).limit(limit).toArray();
      return fallback.map((d) => ({ ...d, score: 0.5 }));
    }
    throw e;
  }
}

export async function analyzeAndSuggest(eventId, userId, sessionId) {
  const db = getDb();
  const id = typeof eventId === 'string' && ObjectId.isValid(eventId) ? new ObjectId(eventId) : eventId;
  const event = await db.collection('news_events').findOne({ _id: id });
  if (!event) throw new Error('Event not found');

  const portfolio = await getOrCreatePortfolio(userId, sessionId);
  if (!portfolio) throw new Error('Portfolio not found');
  const portfolioSummary = portfolio.positions.map((p) => `${p.symbol}: ${p.qty} @ ~$${p.avgCost?.toFixed(0)}`).join(', ') || 'No positions';

  let analogues = [];
  if (event.embedding && event.embedding.length) {
    analogues = await findHistoricalAnalogues(event.embedding, 5);
  } else {
    const fallback = await db.collection('historical_news').find({}).limit(3).toArray();
    analogues = fallback.map((d) => ({ headline: d.headline, body: d.body, category: d.category, sentiment: d.sentiment }));
  }

  const analogueText = analogues.length
    ? analogues.map((a, i) => `${i + 1}. ${a.headline} (${a.sentiment})`).join('\n')
    : 'No historical analogues in database.';

  const systemPrompt = `You are a concise trading analyst for a "Trade the News" game (Indian market). Stocks are NIFTY 50 (NSE symbols); amounts are in INR (₹). Given a news event and the player's portfolio, provide:
1. Brief impact: how this event typically affects the mentioned tickers (1-2 sentences).
2. Portfolio impact: which of the player's positions are affected and how (1-2 sentences).
3. Suggested trades: 1-3 concrete actions, e.g. "Consider selling 10 shares of RELIANCE" or "Hold; event is similar to past event Y." Use NSE symbols and INR. Keep suggestions short and actionable.`;

  const cashINR = Number(portfolio.cash ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const userPrompt = `News: ${event.headline}\n${event.body}\nCategory: ${event.categoryLabel || event.category}, Sentiment: ${event.sentiment}. Tickers: ${(event.tickers || []).join(', ')}.\n\nPlayer portfolio: ${portfolioSummary}. Cash: ₹${cashINR}.\n\nHistorical analogues:\n${analogueText}\n\nProvide: impact, portfolio impact, and suggested trades.`;

  let analysis = 'Analysis unavailable (no API key).';
  let suggestedTrades = [];

  if (openai) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
    });
    const content = res.choices[0]?.message?.content || '';
    analysis = content;
    suggestedTrades = extractSuggestedTrades(content);
  }

  await db.collection('agent_memory').insertOne({
    sessionId,
    userId,
    type: 'analysis',
    eventId: id.toString(),
    content: analysis.slice(0, 2000),
    timestamp: new Date(),
  });

  return { analysis, suggestedTrades, analogues: analogues.map((a) => ({ headline: a.headline, score: a.score })) };
}

function extractSuggestedTrades(text) {
  const lines = text.split('\n').filter((l) => /sell|buy|reduce|add|consider|hold/i.test(l));
  return lines.slice(0, 5).map((l) => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
}
