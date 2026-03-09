# Deploy Trade the News — 6 Steps (One by One)

Use this guide to deploy the app so anyone can play over the internet. Do each step in order.

---

## Step 1: Push the repo to GitHub

**Goal:** Get your code on GitHub so Railway/Render and Vercel can deploy from it.

### 1.1 Initialize Git and commit (run in project root)

```bash
cd /Users/anshuljhansiwale/Documents/GitHub/cursor_projects/game_trade_the_news

git init
git add .
git status
```

Check that `node_modules`, `.env`, and `.next` are **not** listed (they’re in `.gitignore`). If they appear, don’t commit them.

```bash
git commit -m "Trade the News — NIFTY 50, INR, deploy-ready"
```

### 1.2 Create a new repo on GitHub

1. Open **https://github.com/new**
2. **Repository name:** e.g. `game_trade_the_news` (or any name you like)
3. **Public**
4. Do **not** add a README, .gitignore, or license (you already have them)
5. Click **Create repository**

### 1.3 Connect and push

GitHub will show commands; use these (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**Check:** On GitHub you should see your folders: `backend/`, `frontend/`, `README.md`, etc.

---

## Step 2: Create a MongoDB Atlas cluster and get the connection string

**Goal:** Have a database in the cloud that the backend will use.

### 2.1 Create / sign in to Atlas

1. Go to **https://cloud.mongodb.com**
2. Sign in or create an account

### 2.2 Create a cluster

1. **Build a Database** (or **Create**)
2. Choose **M0 (FREE)** and a region near you
3. **Cluster Name:** e.g. `TradeTheNews`
4. Click **Create**

### 2.3 Create a database user

1. **Database Access** → **Add New Database User**
2. **Authentication:** Password
3. **Username:** e.g. `tradenews`
4. **Password:** Create a strong password and **save it**
5. **Database User Privileges:** Atlas admin (or Read and write to any database)
6. **Add User**

### 2.4 Allow network access

1. **Network Access** → **Add IP Address**
2. **Allow Access from Anywhere** → `0.0.0.0/0` (so Railway/Render can connect)
3. **Confirm**

### 2.5 Get the connection string

1. **Database** → **Connect** on your cluster
2. **Drivers** → copy the connection string (e.g. `mongodb+srv://tradenews:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
3. Replace `<password>` with your database user password
4. Add the database name: in the URL, before `?`, add `/trade_the_news`  
   Example: `mongodb+srv://tradenews:MyPass123@cluster0.xxxxx.mongodb.net/trade_the_news?retryWrites=true&w=majority`
5. **Save this** — you’ll use it as `MONGODB_URI` in Step 3

**Check:** You have one string that starts with `mongodb+srv://`, contains your password, and ends with `/trade_the_news?retryWrites=true&w=majority` (or similar).

---

## Step 3: Deploy the backend (Railway or Render)

**Goal:** Backend API running on a public URL. Choose **Railway** or **Render**.

### Option A — Railway

1. Go to **https://railway.app** and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Select your repo (e.g. `game_trade_the_news`). Authorize if asked.
4. After the repo is added, click the new **service**.
5. **Settings**:
   - **Root Directory:** `backend`
   - **Start Command:** leave default or set to `npm start`
6. **Variables** (Settings → Variables or the Variables tab):
   - `MONGODB_URI` = your Atlas connection string from Step 2
   - `VOYAGE_API_KEY` = your Voyage AI key ([dash.voyageai.com](https://dash.voyageai.com))
   - `OPENAI_API_KEY` = your OpenAI key (optional)
   - Leave `CORS_ORIGIN` empty for now (you’ll set it in Step 5)
7. **Deploy:** Railway will build and deploy. Wait until it’s running.
8. **Public URL:** Settings → **Generate Domain** (or **Networking** → **Generate Domain**). Copy the URL, e.g. `https://game-trade-the-news-api-production.up.railway.app`
9. **Seed the database once** (from your computer):

   ```bash
   cd backend
   MONGODB_URI="paste-your-atlas-uri-here" VOYAGE_API_KEY="paste-your-voyage-key-here" npm run seed
   ```

**Check:** Open `https://YOUR-BACKEND-URL/health` in a browser. You should see `{"ok":true}`.

### Option B — Render

1. Go to **https://render.com** and sign in (e.g. with GitHub).
2. **New +** → **Web Service**.
3. Connect your GitHub repo (e.g. `game_trade_the_news`).
4. **Settings:**
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment** (Environment tab):
   - `MONGODB_URI` = your Atlas connection string
   - `VOYAGE_API_KEY` = your Voyage AI key
   - `OPENAI_API_KEY` = your OpenAI key (optional)
   - Leave `CORS_ORIGIN` empty for now
6. **Create Web Service.** Wait until the deploy finishes.
7. Copy the service URL (e.g. `https://game-trade-the-news-api.onrender.com`).
8. **Seed once** (same as Railway):

   ```bash
   cd backend
   MONGODB_URI="paste-your-atlas-uri-here" VOYAGE_API_KEY="paste-your-voyage-key-here" npm run seed
   ```

**Check:** Open `https://YOUR-BACKEND-URL/health` → `{"ok":true}`.

**Write down your backend URL:** you’ll need it in Step 4 and 5.

---

## Step 4: Deploy the frontend (Vercel)

**Goal:** Frontend app on a public URL that talks to your backend.

1. Go to **https://vercel.com** and sign in (e.g. with GitHub).
2. **Add New…** → **Project**.
3. **Import** your repo (e.g. `game_trade_the_news`).
4. **Configure Project:**
   - **Root Directory:** click **Edit** and set to `frontend` (important).
   - **Framework Preset:** Next.js (auto-detected).
   - **Environment Variables:** Add one:
     - **Name:** `NEXT_PUBLIC_API_URL`
     - **Value:** your backend URL from Step 3 (no trailing slash), e.g. `https://game-trade-the-news-api-production.up.railway.app`
5. **Deploy.** Wait until the build finishes.
6. Copy your app URL (e.g. `https://game-trade-the-news.vercel.app`).

**Check:** Open the Vercel URL. If you see “Trade the News” but the app can’t load data, go to Step 5 and set CORS, then test again.

**Write down your frontend URL** for Step 5 and 6.

---

## Step 5: Set backend CORS to your frontend URL

**Goal:** Backend allows requests from your Vercel app so the frontend can call the API.

1. Open your **backend** project on **Railway** or **Render**.
2. **Variables / Environment:**
   - Add or edit:
   - **Name:** `CORS_ORIGIN`
   - **Value:** your **frontend** URL from Step 4 (no trailing slash), e.g. `https://game-trade-the-news.vercel.app`
3. Save. Railway/Render will redeploy automatically.

**Check:** After redeploy, open your **frontend** URL again. Create a game and join — it should load and run without CORS errors.

---

## Step 6: Share the link and play

**Goal:** Others can play from anywhere in a browser.

1. Share your **frontend URL** (e.g. `https://game-trade-the-news.vercel.app`).
2. One person: **Create game** and share the **Session ID** (e.g. `A1B2C3D4`).
3. Others: **Join game** with that Session ID and their name.
4. Everyone plays in the browser; no install.

**Check:** Open the link in an incognito/private window or another device and join a game to confirm it works over the internet.

---

## Quick reference

| Step | What you get |
|-----|----------------|
| 1   | Code on GitHub |
| 2   | Atlas connection string → `MONGODB_URI` |
| 3   | Backend URL (Railway or Render) |
| 4   | Frontend URL (Vercel) |
| 5   | Backend has `CORS_ORIGIN` = frontend URL |
| 6   | Share frontend URL; play from anywhere |

If something fails, check: Atlas IP allowlist (`0.0.0.0/0`), env vars (no typos, no extra spaces), backend `/health` returns `{"ok":true}`, and `NEXT_PUBLIC_API_URL` has no trailing slash.
