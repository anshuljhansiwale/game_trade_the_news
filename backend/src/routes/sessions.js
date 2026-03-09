import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { startSimulation } from '../services/simulation.js';
import { updateLeaderboard } from '../services/portfolio.js';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const db = getDb();
    const sessionId = uuidv4().slice(0, 8);
    const session = {
      sessionId,
      status: 'active',
      startTime: new Date(),
      participants: [],
      currentNewsEventId: null,
    };
    await db.collection('game_sessions').insertOne(session);
    startSimulation(sessionId);
    res.json({ sessionId, status: session.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { sessionId, userName } = req.body;
    if (!sessionId || !userName) return res.status(400).json({ error: 'sessionId and userName required' });
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId, status: 'active' });
    if (!session) return res.status(404).json({ error: 'Session not found or ended' });
    const userId = `${userName}-${Date.now()}`;
    await db.collection('game_sessions').updateOne(
      { sessionId },
      { $addToSet: { participants: { userId, userName } } }
    );
    res.json({ sessionId, userId, userName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:sessionId', async (req, res) => {
  try {
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:sessionId/leaderboard', async (req, res) => {
  try {
    const ranked = await updateLeaderboard(req.params.sessionId);
    res.json(ranked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
