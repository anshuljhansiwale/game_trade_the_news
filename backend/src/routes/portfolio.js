import { Router } from 'express';
import { getOrCreatePortfolio, getSimulatedPrice } from '../services/portfolio.js';
import { NIFTY50_SYMBOLS } from '../constants/nifty50.js';

const router = Router();

router.get('/symbols', (req, res) => {
  res.json({ symbols: NIFTY50_SYMBOLS, currency: 'INR' });
});

router.get('/:sessionId/:userId', async (req, res) => {
  try {
    const portfolio = await getOrCreatePortfolio(req.params.userId, req.params.sessionId);
    const prices = {};
    for (const sym of NIFTY50_SYMBOLS) {
      prices[sym] = getSimulatedPrice(sym);
    }
    res.json({ portfolio, prices, currency: 'INR' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
