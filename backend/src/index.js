import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import sessionsRouter from './routes/sessions.js';
import portfolioRouter from './routes/portfolio.js';
import tradesRouter from './routes/trades.js';
import newsRouter from './routes/news.js';
import agentRouter from './routes/agent.js';

const app = express();

// CORS: allow frontend origin(s) when set (e.g. https://your-app.vercel.app); otherwise allow all (local dev)
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
  ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: false }
  : { origin: true };
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/sessions', sessionsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/news', newsRouter);
app.use('/api/agent', agentRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

connectDb()
  .then(() => {
    app.listen(Number(PORT), HOST, () =>
      console.log(`Trade the News API listening on http://${HOST}:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
