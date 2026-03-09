# Trade the News — Live Simulation Game

Gamified demo: participants get a virtual **₹1,00,000 (INR)** portfolio and trade **NIFTY 50** stocks. Every **60 seconds** a simulated news event drops (earnings surprise, geopolitical event, RBI rate decision). An **AI agent** powered by MongoDB provides real-time analysis: semantic search for historical analogues, portfolio impact, and suggested trades. Participants compete for best returns. MongoDB handles news ingestion, portfolio tracking, analytics, and agent memory — live.

## Quick start

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** cluster ([create one](https://www.mongodb.com/cloud/atlas))
- **Voyage AI** API key for embeddings ([get one](https://dash.voyageai.com/))
- **OpenAI API key** (optional; for LLM analysis only; agent works without it)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI (Atlas connection string), VOYAGE_API_KEY, and optionally OPENAI_API_KEY
npm install
npm run seed   # seed historical_news (requires VOYAGE_API_KEY for embeddings)
npm run dev
```

Backend runs at **http://localhost:4000**.

### 2. Frontend

```bash
cd frontend
# Optional: set NEXT_PUBLIC_API_URL=http://localhost:4000 if API is elsewhere
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**.

### 3. Play

1. Open **http://localhost:3000**.
2. Enter your name and click **Create game** (or **Join game** with a session ID from another player).
3. Wait for the first news event (~10s), then use **Analyze current news** for AI suggestions.
4. Place **Buy** / **Sell** orders. Leaderboard updates live.

---

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | **MongoDB Atlas** connection string (e.g. `mongodb+srv://user:pass@cluster.xxx.mongodb.net/trade_the_news?retryWrites=true&w=majority`) |
| `VOYAGE_API_KEY` | Voyage AI API key for embeddings ([dash.voyageai.com](https://dash.voyageai.com/)) |
| `VOYAGE_EMBEDDING_MODEL` | Voyage model (default: `voyage-3`; or `voyage-4`, `voyage-finance-2`, etc.) |
| `VOYAGE_EMBEDDING_DIMENSIONS` | Embedding dimension (default: 1024; must match Atlas vector index) |
| `OPENAI_API_KEY` | OpenAI API key for LLM analysis only (optional; agent shows “no API key” if missing) |
| `PORT` | Backend port (default: 4000) |
| `CORS_ORIGIN` | **Production:** frontend URL(s) allowed by CORS (e.g. `https://your-app.vercel.app`; comma-separated for multiple) |
| `STARTING_BALANCE` | Virtual starting cash in INR (default: 100000, i.e. ₹1,00,000) |
| `NEXT_EVENT_INTERVAL_MS` | Interval between news events in ms (default: 60000) |

**Frontend (build-time):**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `https://your-api.railway.app` or `https://your-api.onrender.com`). Set in Vercel/Netlify env. |

---

## Deploy over the internet

**Step-by-step guide:** See **[DEPLOY_STEPS.md](./DEPLOY_STEPS.md)** for all 6 steps (GitHub → Atlas → Backend → Frontend → CORS → Share). Use it when you’re ready to go live.

Players need **no install** — they open your app URL in a browser. Use **MongoDB Atlas** and deploy **backend** and **frontend** to the cloud.

### 1. MongoDB Atlas

- Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com/).
- Create a DB user and get the **connection string** (Database → Connect → Drivers). Use database name `trade_the_news`.
- (Optional) Create a **Vector Search** index on `historical_news` → field `embedding`, dimensions **1024**.

### 2. Deploy backend (Railway or Render)

**Option A — Railway**

1. Push your repo to GitHub.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Select the repo and set **Root Directory** to `backend`.
4. Add **Variables**: `MONGODB_URI`, `VOYAGE_API_KEY`, `OPENAI_API_KEY` (optional), `CORS_ORIGIN` (set after frontend is deployed — e.g. `https://your-app.vercel.app`).
5. Deploy. Copy the public URL (e.g. `https://trade-the-news-api.up.railway.app`).
6. **Seed historical news once**: locally run `cd backend && MONGODB_URI="your-atlas-uri" VOYAGE_API_KEY="your-key" npm run seed` (or use Railway’s “Run command” / one-off job if available).

**Option B — Render**

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → New → Web Service. Connect the repo.
3. Set **Root Directory** to `backend`, **Build Command** `npm install`, **Start Command** `npm start`.
4. Add **Environment Variables**: `MONGODB_URI`, `VOYAGE_API_KEY`, `OPENAI_API_KEY` (optional), `CORS_ORIGIN` (your frontend URL).
5. Deploy. Copy the service URL (e.g. `https://trade-the-news-api.onrender.com`).
6. **Seed once** (same as above, from your machine with the same `MONGODB_URI`).

### 3. Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Add New → Project → Import your GitHub repo.
2. Set **Root Directory** to `frontend` (Override).
3. Add **Environment Variable**: `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://trade-the-news-api.up.railway.app` or your Render URL). No trailing slash.
4. Deploy. Vercel gives you a URL (e.g. `https://trade-the-news.vercel.app`).

### 4. Wire backend CORS to frontend

In your backend project (Railway or Render), set **CORS_ORIGIN** to your frontend URL (e.g. `https://trade-the-news.vercel.app`). Redeploy the backend if needed.

### 5. Share and play

- Share the **frontend URL** (e.g. `https://trade-the-news.vercel.app`) with players.
- One person **Create game** and shares the **Session ID**; others **Join game** with that ID.
- Everyone plays in the browser; no install.

---

## MongoDB Atlas setup

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com/).
2. Get your **connection string**: Database → Connect → Drivers → copy the URI. Replace `<password>` with your user password and set the database name (e.g. `trade_the_news`).
3. (Optional) **Vector Search**: In Atlas, go to your cluster → Search → Create Index on the `historical_news` collection:
   - **Index name:** `historical_news_vector`
   - **Field:** `embedding` (type: **vector**, dimensions: **1024** for Voyage AI)

Without the vector index, the agent still runs but uses a simple fallback (recent documents) instead of semantic search.

---

## Project structure

```
game_trade_the_news/
├── backend/           # Node + Express API
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── config.js
│   │   ├── routes/    # sessions, portfolio, trades, news, agent
│   │   └── services/  # simulation, portfolio, agent, embeddings
│   ├── scripts/
│   │   └── seed-historical-news.js
│   ├── Dockerfile     # optional: container deploy
│   └── railway.json   # optional: Railway deploy
├── frontend/          # Next.js app
│   ├── app/           # lobby, game/[sessionId]
│   ├── components/    # Countdown, NewsFeed, AgentPanel, Portfolio, TradeForm, Leaderboard
│   └── lib/api.js
├── render.yaml        # optional: Render.com blueprint (backend)
├── REQUIREMENTS.md
└── README.md
```

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions/create` | Create game session; starts 60s news simulation |
| POST | `/api/sessions/join` | Join session (body: `sessionId`, `userName`) |
| GET | `/api/sessions/:sessionId` | Get session |
| GET | `/api/sessions/:sessionId/leaderboard` | Get leaderboard |
| GET | `/api/portfolio/:sessionId/:userId` | Get portfolio + prices |
| POST | `/api/trades` | Place order (body: `sessionId`, `userId`, `symbol`, `side`, `qty`) |
| GET | `/api/trades/:sessionId/:userId` | Trade history |
| GET | `/api/news/latest/:sessionId` | Latest news event |
| GET | `/api/news/history/:sessionId` | News history |
| POST | `/api/agent/analyze` | AI analysis (body: `eventId`, `userId`, `sessionId`) |

---

## Demo script (for presenters)

**Local:** Start MongoDB (or Atlas), backend, and frontend. Run `npm run seed` in backend once.

**Over internet:** Use deployed app URL; seed is run once against Atlas (see Deploy section).

1. Create a game and share the **Session ID** (e.g. `A1B2C3D4`) so others can join.
2. After the first news event, click **Analyze current news** to show semantic search + LLM suggestions.
3. Place a few trades; refresh or wait for polling to show leaderboard and portfolio updates.
