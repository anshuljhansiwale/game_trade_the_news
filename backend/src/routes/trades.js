import { Router } from 'express';
import { getDb } from '../db.js';
import { executeOrder, updateLeaderboard, getOrCreatePortfolio, getSimulatedPrice } from '../services/portfolio.js';

const router = Router();

/** Fallback when old deployed code throws "Insufficient position" — perform short sell inline */
async function fallbackShortSell(userId, sessionId, symbol, qty) {
  const db = getDb();
  const portfolio = await getOrCreatePortfolio(userId, sessionId);
  portfolio.positions = portfolio.positions || [];
  const price = getSimulatedPrice(symbol);
  const notional = price * qty;
  portfolio.positions = portfolio.positions.filter((p) => String(p.symbol) !== String(symbol));
  portfolio.positions.push({ symbol, qty: -qty, avgCost: price });
  portfolio.cash += notional;
  portfolio.updatedAt = new Date();
  let positionsValue = 0;
  for (const pos of portfolio.positions) {
    positionsValue += getSimulatedPrice(pos.symbol) * pos.qty;
  }
  portfolio.totalValue = portfolio.cash + positionsValue;
  await db.collection('portfolios').replaceOne({ userId, sessionId }, portfolio);
  await db.collection('trades').insertOne({
    userId,
    sessionId,
    symbol,
    side: 'sell',
    qty,
    price,
    timestamp: new Date(),
  });
  return { price, portfolio };
}

router.post('/', async (req, res) => {
  try {
    const { sessionId, userId, symbol, side, qty } = req.body;
    if (!sessionId || !userId || !symbol || !side || qty == null) {
      return res.status(400).json({ error: 'sessionId, userId, symbol, side, qty required' });
    }
    const sid = String(sessionId).trim().toLowerCase();
    const numQty = Math.floor(Number(qty));
    if (numQty <= 0) return res.status(400).json({ error: 'qty must be positive' });
    if (!['buy', 'sell'].includes(side)) return res.status(400).json({ error: 'side must be buy or sell' });
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId: sid });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'ended') return res.status(400).json({ error: 'Game has ended; no new trades allowed' });

    let price, portfolio;
    try {
      const result = await executeOrder(userId, sid, symbol, side, numQty);
      price = result.price;
      portfolio = result.portfolio;
    } catch (e) {
      if (side === 'sell' && (e.message || '').toLowerCase().includes('insufficient position')) {
        const result = await fallbackShortSell(userId, sid, symbol, numQty);
        price = result.price;
        portfolio = result.portfolio;
      } else {
        throw e;
      }
    }
    await updateLeaderboard(sid);
    res.json({ price, portfolio });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:sessionId/:userId', async (req, res) => {
  try {
    const sid = String(req.params.sessionId).trim().toLowerCase();
    const db = getDb();
    const trades = await db.collection('trades')
      .find({ sessionId: sid, userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    res.json(trades);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
