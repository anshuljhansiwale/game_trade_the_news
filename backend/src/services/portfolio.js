import { getDb } from '../db.js';
import { STARTING_BALANCE } from '../config.js';
import { NIFTY50_BASELINE_PRICES } from '../constants/nifty50.js';

const BASELINE_PRICES = NIFTY50_BASELINE_PRICES;

export async function getOrCreatePortfolio(userId, sessionId) {
  const db = getDb();
  let portfolio = await db.collection('portfolios').findOne({ userId, sessionId });
  if (portfolio) {
    await recalcTotalValue(portfolio);
    return portfolio;
  }
  const newPortfolio = {
    userId,
    sessionId,
    cash: STARTING_BALANCE,
    positions: [],
    totalValue: STARTING_BALANCE,
    startValue: STARTING_BALANCE,
    updatedAt: new Date(),
  };
  await db.collection('portfolios').insertOne(newPortfolio);
  return newPortfolio;
}

export async function getPortfolio(userId, sessionId) {
  const db = getDb();
  const portfolio = await db.collection('portfolios').findOne({ userId, sessionId });
  if (!portfolio) return null;
  await recalcTotalValue(portfolio);
  return portfolio;
}

export function getSimulatedPrice(symbol) {
  const base = BASELINE_PRICES[symbol] ?? 100;
  const variation = 0.02;
  return base * (1 + (Math.random() - 0.5) * 2 * variation);
}

export async function executeOrder(userId, sessionId, symbol, side, qty) {
  const db = getDb();
  const portfolio = await getOrCreatePortfolio(userId, sessionId);
  portfolio.positions = portfolio.positions || [];
  const price = getSimulatedPrice(symbol);
  const notional = price * qty;

  if (side === 'buy') {
    if (portfolio.cash < notional) throw new Error('Insufficient cash');
    const existing = portfolio.positions.find((p) => p.symbol === symbol);
    if (existing) {
      const newQty = existing.qty + qty;
      const newCost = (existing.avgCost * existing.qty + price * qty) / newQty;
      existing.qty = newQty;
      existing.avgCost = newCost;
    } else {
      portfolio.positions.push({ symbol, qty, avgCost: price });
    }
    portfolio.cash -= notional;
  } else {
    const pos = portfolio.positions.find((p) => p.symbol === symbol);
    if (pos) {
      const newQty = pos.qty - qty;
      if (newQty === 0) portfolio.positions = portfolio.positions.filter((p) => p.symbol !== symbol);
      else if (newQty > 0) {
        pos.qty = newQty;
      } else {
        pos.qty = newQty;
        pos.avgCost = price;
      }
    } else {
      portfolio.positions.push({ symbol, qty: -qty, avgCost: price });
    }
    portfolio.cash += notional;
  }

  portfolio.updatedAt = new Date();
  await recalcTotalValue(portfolio);
  await db.collection('portfolios').replaceOne({ userId, sessionId }, portfolio);

  await db.collection('trades').insertOne({
    userId,
    sessionId,
    symbol,
    side,
    qty,
    price,
    timestamp: new Date(),
  });

  return { price, portfolio };
}

async function recalcTotalValue(portfolio) {
  let positionsValue = 0;
  for (const pos of portfolio.positions) {
    positionsValue += getSimulatedPrice(pos.symbol) * pos.qty;
  }
  portfolio.totalValue = portfolio.cash + positionsValue;
  return portfolio;
}

export async function squareOffAllPortfolios(sessionId) {
  const db = getDb();
  const portfolios = await db.collection('portfolios').find({ sessionId }).toArray();
  for (const portfolio of portfolios) {
    const positions = [...(portfolio.positions || [])];
    const longs = positions.filter((p) => p.qty > 0);
    const shorts = positions.filter((p) => p.qty < 0);
    for (const pos of longs) {
      await executeOrder(portfolio.userId, sessionId, pos.symbol, 'sell', pos.qty);
    }
    for (const pos of shorts) {
      await executeOrder(portfolio.userId, sessionId, pos.symbol, 'buy', -pos.qty);
    }
  }
}

export async function updateLeaderboard(sessionId) {
  const db = getDb();
  const session = await db.collection('game_sessions').findOne({ sessionId });
  const participants = (session?.participants || []).reduce((acc, p) => ({ ...acc, [p.userId]: p.userName }), {});
  const portfolios = await db.collection('portfolios').find({ sessionId }).toArray();
  const entries = portfolios.map((p) => ({
    userId: p.userId,
    userName: participants[p.userId] ?? p.userId,
    sessionId,
    startValue: p.startValue ?? p.totalValue,
    endValue: p.totalValue,
    returnPct: ((p.totalValue - (p.startValue ?? p.totalValue)) / (p.startValue ?? p.totalValue)) * 100,
  }));
  entries.sort((a, b) => b.returnPct - a.returnPct);
  const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));
  await db.collection('leaderboard').deleteMany({ sessionId });
  if (ranked.length) await db.collection('leaderboard').insertMany(ranked);
  return ranked;
}
