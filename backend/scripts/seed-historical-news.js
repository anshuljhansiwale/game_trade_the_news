import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../src/services/embeddings.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_the_news';

const HISTORICAL = [
  { headline: 'Reliance Industries beats Q3 estimates; retail and Jio drive growth', body: 'Revenue above consensus. Management raised full-year guidance.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'beat', tickers: ['RELIANCE', 'TCS', 'INFY'] },
  { headline: 'HDFC Bank quarterly profit beats estimates', body: 'Net interest income and loan growth above expectations. Asset quality stable.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'beat', tickers: ['HDFCBANK', 'ICICIBANK'] },
  { headline: 'TCS reports earnings beat on strong deal pipeline', body: 'IT major tops street estimates. North America and BFSI verticals lead.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'beat', tickers: ['TCS', 'INFY', 'HCLTECH'] },
  { headline: 'Bank reports earnings miss on higher provisions', body: 'NII in line but provisions weigh. Slippages from one large account.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'miss', tickers: ['HDFCBANK', 'ICICIBANK'] },
  { headline: 'Infosys misses earnings; cites client spending cuts', body: 'Revenue and margins below consensus. Company lowered full-year outlook.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'miss', tickers: ['TCS', 'INFY'] },
  { headline: 'Tata Motors earnings miss on weak rural demand', body: 'Volume and margin pressure. Management flags cautious outlook.', category: 'earnings', categoryLabel: 'Earnings Surprise', sentiment: 'miss', tickers: ['TATAMOTORS', 'MARUTI'] },
  { headline: 'RBI holds repo rate; signals prolonged pause', body: 'Inflation still above target. Bond yields rise.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'hawkish', tickers: ['SBIN', 'HDFCBANK', 'AXISBANK'] },
  { headline: 'RBI holds rates; hints at easing if inflation eases', body: 'Inflation cooling. Markets price possible cut; equities rally.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'dovish', tickers: ['HDFCBANK', 'ICICIBANK', 'LT'] },
  { headline: 'RBI keeps policy rate unchanged; growth focus', body: 'Growth concerns cited. Bond yields dip; rate-sensitive sectors gain.', category: 'rates', categoryLabel: 'Rate Decision', sentiment: 'dovish', tickers: ['SBIN', 'BAJFINANCE'] },
  { headline: 'Trade tensions ease; Nifty extends gains', body: 'New framework announced. Risk assets gain; banks and metals lead.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-on', tickers: ['RELIANCE', 'TATASTEEL', 'JSWSTEEL'] },
  { headline: 'Escalation in region sends investors to safe havens', body: 'Gold and bonds rally. Nifty declines; IT relatively resilient.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-off', tickers: ['TCS', 'INFY', 'HCLTECH'] },
  { headline: 'Ceasefire talks progress; indices rise', body: 'Investors shift to risk-on. FII buying continues.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-on', tickers: ['RELIANCE', 'BHARTIARTL'] },
  { headline: 'Supply chain disruption fears grow', body: 'Commodity prices spike; auto and industrials underperform.', category: 'geopolitical', categoryLabel: 'Geopolitical Event', sentiment: 'risk-off', tickers: ['ONGC', 'COALINDIA'] },
  { headline: 'IT sector outlook upgraded; deal wins and AI tailwinds', body: 'Analysts raise sector weight. Large caps lead.', category: 'sector', categoryLabel: 'Sector Update', sentiment: 'positive', tickers: ['TCS', 'INFY', 'HCLTECH'] },
  { headline: 'Steel prices firm on demand; mills raise guidance', body: 'Domestic demand strong. Export opportunities improve.', category: 'commodity', categoryLabel: 'Commodity & Input Costs', sentiment: 'bullish', tickers: ['TATASTEEL', 'JSWSTEEL'] },
  { headline: 'FII buying accelerates; India weight in EM funds rises', body: 'Reform momentum and earnings visibility attract flows.', category: 'fii', categoryLabel: 'FII / DII Flows', sentiment: 'inflow', tickers: ['HDFCBANK', 'RELIANCE', 'ICICIBANK'] },
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
