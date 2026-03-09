import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../src/services/embeddings.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_the_news';

const HISTORICAL = [
  { headline: 'Reliance Industries beats Q3 estimates; retail and Jio drive growth', body: 'Revenue above consensus. Management raised full-year guidance.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'beat', tickers: ['RELIANCE', 'TCS', 'INFY'] },
  { headline: 'Bank reports earnings miss on higher provisions', body: 'NII in line but provisions weigh. Slippages from one large account.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'miss', tickers: ['HDFCBANK', 'ICICIBANK'] },
  { headline: 'RBI holds repo rate; signals prolonged pause', body: 'Inflation still above target. Bond yields rise.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'hawkish', tickers: ['SBIN', 'HDFCBANK', 'AXISBANK'] },
  { headline: 'RBI holds rates; hints at easing if inflation eases', body: 'Inflation cooling. Markets price possible cut; equities rally.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'dovish', tickers: ['HDFCBANK', 'ICICIBANK', 'LT'] },
  { headline: 'Trade tensions ease; Nifty extends gains', body: 'New framework announced. Risk assets gain; banks and metals lead.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-on', tickers: ['RELIANCE', 'TATASTEEL', 'JSWSTEEL'] },
  { headline: 'Escalation in region sends investors to safe havens', body: 'Gold and bonds rally. Nifty declines; IT relatively resilient.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-off', tickers: ['TCS', 'INFY', 'HCLTECH'] },
  { headline: 'IT major misses earnings; cites client spending cuts', body: 'Revenue and margins below consensus. Company lowered full-year outlook.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'miss', tickers: ['TCS', 'INFY'] },
  { headline: 'RBI keeps policy rate unchanged; growth focus', body: 'Growth concerns cited. Bond yields dip; rate-sensitive sectors gain.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'dovish', tickers: ['SBIN', 'BAJFINANCE'] },
  { headline: 'Ceasefire talks progress; indices rise', body: 'Investors shift to risk-on. FII buying continues.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-on', tickers: ['RELIANCE', 'BHARTIARTL'] },
  { headline: 'Supply chain disruption fears grow', body: 'Commodity prices spike; auto and industrials underperform.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-off', tickers: ['ONGC', 'COALINDIA'] },
];

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const col = db.collection('historical_news');
  await col.deleteMany({});

  for (const doc of HISTORICAL) {
    const text = `${doc.headline} ${doc.body} ${doc.categoryLabel} ${doc.sentiment} ${doc.tickers.join(' ')}`;
    const embedding = await getEmbedding(text);
    await col.insertOne({
      ...doc,
      publishedAt: new Date(),
      embedding: embedding || undefined,
    });
  }

  console.log(`Seeded ${HISTORICAL.length} historical news documents.`);
  await client.close();
}

seed().catch((e) => { console.error(e); process.exit(1); });
