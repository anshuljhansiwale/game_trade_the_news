import { Router } from 'express';
import { getDb } from '../db.js';
import { executeOrder, updateLeaderboard } from '../services/portfolio.js';

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
    const { price, portfolio } = await executeOrder(userId, sid, symbol, side, numQty);
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
