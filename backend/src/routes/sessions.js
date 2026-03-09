import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { startSimulation, stopSimulation } from '../services/simulation.js';
import { updateLeaderboard, squareOffAllPortfolios } from '../services/portfolio.js';

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
    const sid = String(sessionId).trim().toLowerCase();
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId: sid, status: 'active' });
    if (!session) return res.status(404).json({ error: 'Session not found or ended' });
    const userId = `${userName}-${Date.now()}`;
    await db.collection('game_sessions').updateOne(
      { sessionId: sid },
      { $addToSet: { participants: { userId, userName } } }
    );
    res.json({ sessionId: sid, userId, userName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/end', async (req, res) => {
  try {
    const sessionId = req.body?.sessionId ?? req.params?.sessionId;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const sid = String(sessionId).trim().toLowerCase();
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId: sid, status: 'active' });
    if (!session) return res.status(404).json({ error: 'Session not found or already ended' });
    stopSimulation(sid);
    await squareOffAllPortfolios(sid);
    const ranked = await updateLeaderboard(sid);
    await db.collection('game_sessions').updateOne(
      { sessionId: sid },
      { $set: { status: 'ended', endTime: new Date() } }
    );
    const winner = ranked[0];
    res.json({ status: 'ended', leaderboard: ranked, winner: winner ? { userName: winner.userName, returnPct: winner.returnPct } : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:sessionId', async (req, res) => {
  try {
    const sid = String(req.params.sessionId).trim().toLowerCase();
    const db = getDb();
    const session = await db.collection('game_sessions').findOne({ sessionId: sid });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:sessionId/leaderboard', async (req, res) => {
  try {
    const sid = String(req.params.sessionId).trim().toLowerCase();
    const ranked = await updateLeaderboard(sid);
    res.json(ranked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
