# "Trade the News" — Demo Application Requirements

## 1. High-Level Architecture

| Layer | Responsibility |
|-------|----------------|
| **Frontend** | Live game UI, portfolio view, news feed, leaderboard, trade execution |
| **Backend / API** | Game state, session management, orchestration |
| **MongoDB** | News store, portfolios, analytics, vector search, agent memory |
| **AI Agent** | Semantic search, analysis, trade suggestions (MongoDB-powered) |
| **Simulation Engine** | Timed news events, market impact simulation |

---

## 2. Data & MongoDB

### 2.1 Collections & Schemas

| Collection | Purpose | Key Fields / Indexes |
|------------|---------|----------------------|
| **news_events** | Ingested & simulated news | `{ headline, body, category, sentiment, tickers[], publishedAt, embedding[] }` — Atlas Vector Search on `embedding` |
| **historical_news** | Seed data for semantic analogues | Same schema as above; pre-populated |
| **portfolios** | Per-participant virtual portfolio | `{ userId, sessionId, cash, positions[{ symbol, qty, avgCost }], totalValue, updatedAt }` |
| **trades** | Trade history | `{ userId, sessionId, symbol, side, qty, price, newsEventId?, timestamp }` |
| **leaderboard** / **scores** | Best returns per session | `{ userId, sessionId, startValue, endValue, returnPct, rank }` |
| **agent_memory** | Agent context for analysis | `{ sessionId?, userId?, type, content, embedding?, timestamp }` — optional vector search |
| **game_sessions** | Active game config & state | `{ sessionId, status, startTime, endTime?, participants[], currentNewsEventId? }` |

### 2.2 MongoDB Capabilities Used

- **Atlas Vector Search** — Semantic search over `news_events` / `historical_news` for “historical analogues.”
- **Change Streams** (optional) — Real-time push of new news/leaderboard updates to clients.
- **Aggregation** — Portfolio P&amp;L, leaderboard ranking, analytics.
- **Time-series or regular collections** — For high-volume trade/event logs if needed.

---

## 3. News Simulation

### 3.1 Event Types (Examples)

- Earnings surprise (beat/miss, sector)
- Geopolitical event (region, impact: risk-on / risk-off)
- Rate decision (Fed, ECB, etc. — hawkish/dovish)

### 3.2 Simulation Engine Needs

- **Scheduler** — Fire every 60 seconds (cron, background worker, or serverless timer).
- **Event generator** — Template-based or LLM-generated headlines + body + metadata (category, sentiment, affected tickers).
- **Persistence** — Each event written to `news_events` (and optionally `historical_news` for replay).
- **Embeddings** — For each new event, compute embedding (e.g. via Atlas Vector Search integration or external embedding API) and store in document.

---

## 4. AI Agent (MongoDB-Powered)

### 4.1 Inputs

- Current news event (headline, body, category, tickers).
- Current user portfolio (or anonymized snapshot).
- Optional: recent agent_memory for session.

### 4.2 Agent Responsibilities

1. **Semantic search** — Query MongoDB vector index with current event embedding → retrieve top-k historical analogues (e.g. from `historical_news`).
2. **Portfolio impact** — Map event to affected positions; optional simple “impact score” or scenario.
3. **Suggested trades** — E.g. “Consider reducing X, adding Y” or “Hold; event similar to past event Z.”
4. **Memory** — Store reasoning or key facts in `agent_memory` for follow-up or consistency.

### 4.3 Implementation Options

- **MongoDB Atlas Vector Search** + **App Services / Functions** — Serverless functions that run search and call LLM (e.g. OpenAI) with context.
- **Backend service** (Node/Python) — Receives event + portfolio, runs vector search in MongoDB, builds prompt, calls LLM, writes to `agent_memory`, returns analysis + suggested trades.

---

## 5. Portfolio & Trading

### 5.1 Rules

- Starting balance: **$100,000** virtual.
- **Order types** — Market only (simplified): execute at current “simulated” price.
- **Simulated prices** — Can be deterministic (e.g. ±N% from a baseline per event type) or fetched from a free market-data API for demo.

### 5.2 Backend Logic

- **Order validation** — Cash vs. buy amount; position size vs. sell.
- **Execution** — Update `portfolios` (cash, positions) and append to `trades`.
- **Valuation** — On each trade or on timer: mark-to-market positions, update `totalValue`; optionally push to leaderboard.

---

## 6. Leaderboard & Competition

- **Metric** — Return % from $100K over session (or fixed time window).
- **Storage** — `scores` or `leaderboard` collection; updated on session end or periodically.
- **API** — GET leaderboard (top N); optionally paginate.
- **Real-time** — Optional: Change Streams or polling so UI updates live.

---

## 7. APIs (REST or GraphQL)

| Endpoint / Area | Purpose |
|-----------------|--------|
| **Auth / Session** | Create/join game session; identify participant (e.g. name or ID). |
| **Portfolio** | GET my portfolio; GET my trade history. |
| **Trading** | POST order (symbol, side, qty). |
| **News** | GET latest event; GET stream (polling or SSE). |
| **Agent** | POST “analyze” (eventId + userId/sessionId) → semantic search + impact + suggested trades. |
| **Leaderboard** | GET leaderboard for session. |
| **Admin / Simulation** | Trigger next event (or start/stop game) — optional, for demo control. |

---

## 8. Frontend

### 8.1 Screens / Components

- **Lobby / Join** — Enter name, join or create session.
- **Game dashboard** — Portfolio (cash + positions), current value, P&amp;L.
- **News feed** — Latest event (headline, body, time); optional history.
- **Agent panel** — “Analysis” and “Suggested trades” for current event.
- **Trade panel** — Symbol, buy/sell, quantity, submit.
- **Leaderboard** — Rank, participant, return %.

### 8.2 Real-Time UX

- **60-second ticker** — Countdown to next news event.
- **Live updates** — Portfolio and leaderboard via polling or WebSocket/SSE.

---

## 9. Tech Stack Suggestions

| Component | Options |
|-----------|--------|
| **Frontend** | React / Next.js or Vue; Tailwind for UI; optional: Socket.io or SSE for live updates. |
| **Backend** | Node.js (Express/Fastify) or Python (FastAPI); session store in MongoDB or in-memory for demo. |
| **MongoDB** | Atlas cluster; Vector Search index on news collections. |
| **Embeddings** | OpenAI `text-embedding-3-small` or similar; store in MongoDB. |
| **LLM** | OpenAI GPT-4 or similar for agent reasoning and suggestions. |
| **Deployment** | Backend on Railway/Render/Fly; Frontend on Vercel/Netlify; MongoDB Atlas. |

---

## 10. Implementation Phases

| Phase | Scope |
|-------|--------|
| **1. Data & MongoDB** | Create Atlas cluster; define collections; seed `historical_news`; create vector index. |
| **2. Simulation** | Event generator + 60s scheduler; write to `news_events`; generate embeddings. |
| **3. Portfolio & Trades** | Portfolio CRUD; order validation & execution; simulated prices. |
| **4. Agent** | Vector search for analogues; LLM integration; impact + suggestions; agent_memory. |
| **5. APIs** | Session, portfolio, trades, news, agent, leaderboard. |
| **6. Frontend** | Lobby, dashboard, news feed, agent panel, trade panel, leaderboard; optional live updates. |
| **7. Polish** | Leaderboard live refresh; countdown; error handling; demo script. |

---

## 11. Non-Functional / Demo

- **Config** — Event interval (e.g. 60s), starting balance ($100K), session duration.
- **Secrets** — MongoDB URI, OpenAI (or other) API keys in env vars.
- **Demo script** — One-page “how to run and play” for presenters.

---

## Summary Checklist

- [ ] MongoDB Atlas cluster + Vector Search index on news
- [ ] Collections: news_events, historical_news, portfolios, trades, leaderboard/scores, agent_memory, game_sessions
- [ ] News simulation: 60s scheduler, event generator, embeddings
- [ ] Portfolio engine: $100K start, order validation, simulated execution
- [ ] AI agent: semantic search (MongoDB), LLM, impact + suggestions, memory
- [ ] REST/GraphQL API for session, portfolio, trades, news, agent, leaderboard
- [ ] Frontend: lobby, dashboard, news feed, agent panel, trade panel, leaderboard
- [ ] Optional: real-time (Change Streams, SSE, or WebSocket) for news and leaderboard
