import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/latest/:sessionId', async (req, res) => {
  try {
    const sid = String(req.params.sessionId).trim().toLowerCase();
    const db = getDb();
    const event = await db.collection('news_events')
      .findOne({ sessionId: sid }, { sort: { publishedAt: -1 }, projection: { embedding: 0 } });
    if (!event) return res.json(null);
    res.json({ ...event, id: event._id.toString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/history/:sessionId', async (req, res) => {
  try {
    const sid = String(req.params.sessionId).trim().toLowerCase();
    const db = getDb();
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const events = await db.collection('news_events')
      .find({ sessionId: sid }, { sort: { publishedAt: -1 }, limit, projection: { embedding: 0 } })
      .toArray();
    res.json(events.map((e) => ({ ...e, id: e._id.toString() })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
