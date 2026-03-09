import { Router } from 'express';
import { getDb } from '../db.js';
import { executeOrder, executeShortSell, updateLeaderboard, getOrCreatePortfolio } from '../services/portfolio.js';

const router = Router();

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

    let result;
    if (side === 'sell') {
      const portfolio = await getOrCreatePortfolio(userId, sid);
      const pos = (portfolio.positions || []).find((p) => String(p.symbol) === String(symbol));
      const hasPosition = pos != null && Number(pos.qty) !== 0;
      result = hasPosition
        ? await executeOrder(userId, sid, symbol, side, numQty)
        : await executeShortSell(userId, sid, symbol, numQty);
    } else {
      result = await executeOrder(userId, sid, symbol, side, numQty);
    }
    await updateLeaderboard(sid);
    res.json({ price: result.price, portfolio: result.portfolio });
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
