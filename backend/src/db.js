import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_the_news';
let client;
let db;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  await ensureIndexes(db);
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not connected. Call connectDb() first.');
  return db;
}

async function ensureIndexes(database) {
  const newsEvents = database.collection('news_events');
  const historicalNews = database.collection('historical_news');
  const portfolios = database.collection('portfolios');
  const gameSessions = database.collection('game_sessions');
  const leaderboard = database.collection('leaderboard');

  await newsEvents.createIndex({ publishedAt: -1 });
  await newsEvents.createIndex({ sessionId: 1, publishedAt: -1 });
  await historicalNews.createIndex({ publishedAt: -1 });
  await portfolios.createIndex({ userId: 1, sessionId: 1 }, { unique: true });
  await gameSessions.createIndex({ sessionId: 1 }, { unique: true });
  await gameSessions.createIndex({ status: 1 });
  await leaderboard.createIndex({ sessionId: 1, returnPct: -1 });

  // Vector index must be created in Atlas UI or via Atlas Admin API for vectorSearch.
  // For local MongoDB without Atlas, we use $vectorSearch only if index exists; else skip vector search.
}

export async function closeDb() {
  if (client) await client.close();
  client = null;
  db = null;
}
