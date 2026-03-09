import { Router } from 'express';
import { analyzeAndSuggest } from '../services/agent.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const { eventId, userId, sessionId } = req.body;
    if (!eventId || !userId || !sessionId) {
      return res.status(400).json({ error: 'eventId, userId, sessionId required' });
    }
    const result = await analyzeAndSuggest(eventId, userId, sessionId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
