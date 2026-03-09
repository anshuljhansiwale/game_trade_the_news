import { getDb } from '../db.js';
import { getEmbedding } from './embeddings.js';
import { NEXT_EVENT_INTERVAL_MS } from '../config.js';

/** Symbol → display name for headlines */
const COMPANY_NAMES = {
  RELIANCE: 'Reliance Industries', TCS: 'TCS', INFY: 'Infosys', HDFCBANK: 'HDFC Bank', ICICIBANK: 'ICICI Bank',
  SBIN: 'SBI', BHARTIARTL: 'Bharti Airtel', ITC: 'ITC', KOTAKBANK: 'Kotak Bank', AXISBANK: 'Axis Bank',
  TATASTEEL: 'Tata Steel', TATAMOTORS: 'Tata Motors', HINDUNILVR: 'Hindustan Unilever', LT: 'Larsen & Toubro',
  MARUTI: 'Maruti Suzuki', HCLTECH: 'HCL Tech', WIPRO: 'Wipro', SUNPHARMA: 'Sun Pharma', ULTRACEMCO: 'UltraTech',
  TITAN: 'Titan', BAJFINANCE: 'Bajaj Finance', ONGC: 'ONGC', BPCL: 'BPCL', COALINDIA: 'Coal India',
  HINDALCO: 'Hindalco', JSWSTEEL: 'JSW Steel', M_M: 'M&M', ASIANPAINT: 'Asian Paints', NESTLEIND: 'Nestlé India',
  POWERGRID: 'Power Grid', INDUSINDBK: 'IndusInd Bank', NTPC: 'NTPC', HDFCLIFE: 'HDFC Life', DIVISLAB: 'Divi\'s Labs',
  BRITANNIA: 'Britannia', ADANIPORTS: 'Adani Ports', CIPLA: 'Cipla', DRREDDY: 'Dr Reddy\'s', EICHERMOT: 'Eicher Motors',
  GRASIM: 'Grasim', APOLLOHOSP: 'Apollo Hospitals', HEROMOTOCO: 'Hero MotoCorp', ADANIENT: 'Adani Enterprises',
  LTIM: 'LTIMindtree', SBILIFE: 'SBI Life', TECHM: 'Tech Mahindra', TATACONSUM: 'Tata Consumer',
};

const CATEGORIES = [
  { id: 'earnings', label: 'Earnings Surprise', tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATASTEEL', 'TATAMOTORS', 'HINDUNILVR', 'WIPRO', 'HCLTECH', 'SUNPHARMA', 'MARUTI'], sentiments: ['beat', 'miss'] },
  { id: 'geopolitical', label: 'Geopolitical Event', tickers: ['RELIANCE', 'ONGC', 'BPCL', 'COALINDIA', 'HINDALCO', 'JSWSTEEL', 'BHARTIARTL', 'ITC', 'TATASTEEL', 'ADANIPORTS'], sentiments: ['risk-on', 'risk-off'] },
  { id: 'rates', label: 'Rate Decision', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE', 'RELIANCE', 'LT', 'INDUSINDBK'], sentiments: ['hawkish', 'dovish'] },
  { id: 'sector', label: 'Sector Update', tickers: ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'BHARTIARTL', 'RELIANCE', 'SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'TATAMOTORS', 'MARUTI', 'M_M', 'EICHERMOT'], sentiments: ['positive', 'negative'] },
  { id: 'commodity', label: 'Commodity & Input Costs', tickers: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'ULTRACEMCO', 'GRASIM', 'COALINDIA', 'ONGC', 'BPCL', 'TATAMOTORS', 'MARUTI'], sentiments: ['bullish', 'bearish'] },
  { id: 'fii', label: 'FII / DII Flows', tickers: ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS', 'BHARTIARTL', 'LT', 'KOTAKBANK', 'AXISBANK'], sentiments: ['inflow', 'outflow'] },
];

/** Templates with {{company}} placeholder; pick one and substitute */
const TEMPLATES = {
  earnings: {
    beat: [
      { headline: '{{company}} beats Q3 estimates; revenue and margins ahead of street', body: 'Management raised full-year guidance. Analysts upgrade targets; stock up in pre-market.' },
      { headline: '{{company}} quarterly profit beats on strong operational performance', body: 'Revenue above consensus. Key segments outperform; attrition eases.' },
      { headline: '{{company}} earnings surprise; deal pipeline and order book robust', body: 'Street upgrades estimates. Management confident on FY outlook.' },
      { headline: '{{company}} Q3 results beat; NII and loan growth exceed expectations', body: 'Asset quality stable. Bank flags expansion in retail and SME.' },
      { headline: '{{company}} tops estimates; digital and new business drive growth', body: 'Margins expand. Capex guidance maintained; free cash flow strong.' },
      { headline: '{{company}} reports earnings beat; rural recovery aids volume', body: 'Volume growth ahead of industry. Pricing power intact.' },
    ],
    miss: [
      { headline: '{{company}} misses earnings; cites client spending cuts and delays', body: 'Revenue and margins below consensus. Company lowered full-year guidance.' },
      { headline: '{{company}} quarterly profit misses on higher provisions', body: 'NII in line but provisions weigh. Slippages from select accounts.' },
      { headline: '{{company}} earnings miss on weak rural demand and input cost pressure', body: 'Volume and margin pressure. Management flags cautious outlook.' },
      { headline: '{{company}} results disappoint; forex and commodity headwinds', body: 'Street cuts estimates. Management guides for gradual recovery.' },
      { headline: '{{company}} misses on execution delays and project pushbacks', body: 'Order book strong but conversion slower. Margins compressed.' },
      { headline: '{{company}} Q3 miss; competition and pricing pressure weigh', body: 'Market share concerns. Cost cuts underway; FY guidance trimmed.' },
    ],
  },
  geopolitical: {
    'risk-on': [
      { headline: 'Trade tensions ease; Nifty extends gains; FII buying accelerates', body: 'New framework announced. Risk assets gain; banks and metals lead.' },
      { headline: 'Ceasefire talks progress; indices rise; rupee strengthens', body: 'Investors shift to risk-on. Commodities and equities advance.' },
      { headline: 'Global risk sentiment improves; India outperforms EM peers', body: 'Dollar weakens. Cyclicals and financials lead; IT mixed.' },
      { headline: 'Supply chain normalisation hopes boost industrials and autos', body: 'Raw material costs ease. Export-oriented sectors gain.' },
      { headline: 'Diplomatic breakthrough lifts sentiment; midcaps rally', body: 'FII flows turn positive. Domestic liquidity supports.' },
    ],
    'risk-off': [
      { headline: 'Escalation in region sends investors to safe havens', body: 'Gold and bonds rally. Nifty declines; IT and pharma relatively resilient.' },
      { headline: 'Supply chain disruption fears grow; commodity prices spike', body: 'Auto and industrials underperform. Defensives in favour.' },
      { headline: 'Geopolitical uncertainty weighs; FII selling intensifies', body: 'Rupee weakens. Exporters gain; rate sensitives under pressure.' },
      { headline: 'Risk-off sentiment; defensives and IT hold up', body: 'Banks and cyclicals lead decline. Volatility index spikes.' },
      { headline: 'Global growth concerns resurface; risk assets correct', body: 'Commodity prices soften. Domestic consumption names mixed.' },
    ],
  },
  rates: {
    hawkish: [
      { headline: 'RBI holds repo rate; signals prolonged pause on inflation', body: 'Inflation still above target. MPC keeps stance withdrawal of accommodation; bond yields rise.' },
      { headline: 'RBI keeps rates unchanged; inflation focus stays', body: 'No change in repo or stance. Markets price delayed rate cuts; bank stocks mixed.' },
      { headline: 'RBI policy: hawkish hold; liquidity to remain tight', body: 'CRR and SLR unchanged. Deposit rate competition to persist.' },
      { headline: 'MPC holds; inflation print above 4% target', body: 'Food inflation sticky. Bond yields up; NBFCs under pressure.' },
      { headline: 'RBI maintains status quo; growth-inflation balance tilted', body: 'Real rates positive. Banks benefit; real estate mixed.' },
    ],
    dovish: [
      { headline: 'RBI holds rates; hints at easing if inflation eases', body: 'Inflation cooling. Markets price possible cut in second half; equities and bonds rally.' },
      { headline: 'RBI keeps policy rate unchanged; growth focus', body: 'Growth concerns cited. Bond yields dip; rate-sensitive sectors gain.' },
      { headline: 'RBI policy: neutral stance; room for cut if data allows', body: 'Liquidity to improve. Auto, realty, and NBFCs gain.' },
      { headline: 'MPC holds; dovish commentary on growth', body: 'Inflation trajectory favourable. Banks and financials rally.' },
      { headline: 'RBI maintains pause; market prices 50bps cut in FY26', body: 'G-Sec yields fall. Rate-sensitive stocks extend gains.' },
    ],
  },
  sector: {
    positive: [
      { headline: 'IT sector outlook upgraded; deal wins and AI tailwinds', body: 'Analysts raise sector weight. Large caps lead; midcaps follow.' },
      { headline: 'Telecom tariff hikes boost ARPU; sector re-rated', body: 'Subscriber adds strong. Capex cycle moderating.' },
      { headline: 'Pharma exports surge; USFDA clearances accelerate', body: 'Generic pipeline robust. Domestic formulations stable.' },
      { headline: 'Auto sales beat estimates; inventory normalising', body: 'PV and 2W demand strong. EV mix improving.' },
      { headline: 'Consumer staples volume growth improves; rural recovery', body: 'Premiumisation continues. Input costs stable.' },
    ],
    negative: [
      { headline: 'IT sector faces margin pressure; deal delays persist', body: 'Client spending cautious. Attrition and wage inflation weigh.' },
      { headline: 'Telecom competition intensifies; ARPU pressure', body: 'Spectrum costs rise. 5G monetisation slower than expected.' },
      { headline: 'Pharma US pricing pressure; plant issues weigh', body: 'Generic erosion. Domestic growth moderating.' },
      { headline: 'Auto demand softens; inventory builds up', body: 'Discounts rise. EV adoption slower; hybrids gain.' },
      { headline: 'Consumer staples volume weak; rural stress', body: 'Premium growth slows. Input cost inflation returns.' },
    ],
  },
  commodity: {
    bullish: [
      { headline: 'Steel prices firm on demand; mills raise guidance', body: 'Domestic demand strong. Export opportunities improve.' },
      { headline: 'Aluminium and copper rally on supply concerns', body: 'Smelter cuts. Auto and cable makers face cost pressure.' },
      { headline: 'Crude oil rises; OMCs and upstream gain', body: 'Geopolitical premium. Refining margins expand.' },
      { headline: 'Cement demand strong; pricing power returns', body: 'Infra push. Capacity utilisation improves.' },
      { headline: 'Coal prices stabilise; power and metals benefit', body: 'Inventory normalising. Import dependency eases.' },
    ],
    bearish: [
      { headline: 'Steel prices correct; oversupply concerns', body: 'Chinese exports weigh. Domestic mills cut prices.' },
      { headline: 'Commodity prices soften; input cost relief for industrials', body: 'Aluminium, copper down. Auto and cables benefit.' },
      { headline: 'Crude oil falls; OMC margins improve', body: 'Demand concerns. Downstream margins expand.' },
      { headline: 'Cement prices under pressure; capacity additions', body: 'Competition intensifies. Volume growth slows.' },
      { headline: 'Coal prices ease; power sector relief', body: 'Domestic production up. Import bill falls.' },
    ],
  },
  fii: {
    inflow: [
      { headline: 'FII buying accelerates; India weight in EM funds rises', body: 'Reform momentum and earnings visibility attract flows. Banks and financials lead.' },
      { headline: 'Strong FII inflows; India premium to EM expands', body: 'Bond inclusion and equity rebalancing support. Rupee stable.' },
      { headline: 'DII and FII both net buyers; liquidity ample', body: 'Domestic SIP flows at record. FII adds to large caps.' },
      { headline: 'FII flows turn positive after 4 weeks of outflows', body: 'Valuation comfort and earnings upgrade cycle. Midcaps attract.' },
      { headline: 'India dedicated funds see record inflows', body: 'Allocation shift from China. Financials and IT favoured.' },
    ],
    outflow: [
      { headline: 'FII selling continues; India underperforms EM', body: 'Risk-off and China reopening trade. Banks and cyclicals hit.' },
      { headline: 'FII outflows accelerate; rupee weakens', body: 'Global yields rise. Rate sensitives under pressure.' },
      { headline: 'FII reduce India weight; profit booking in large caps', body: 'Valuation concerns. Domestic flows cushion.' },
      { headline: 'Sustained FII selling; DII steps in', body: 'Redemption pressure in EM funds. Domestic SIP supports.' },
      { headline: 'FII trim financials and IT; defensives hold', body: 'Sector rotation. Pharma and consumer gain.' },
    ],
  },
};

let simulationInterval = null;
let activeSessionId = null;
const recentEventKeys = new Map(); // sessionId -> Set of "category:sentiment:headline" to avoid repeats

function pickTickers(category, count = 3) {
  const arr = [...category.tickers].sort(() => Math.random() - 0.5);
  return arr.slice(0, Math.min(count, arr.length));
}

function substituteCompany(template, tickers) {
  const company = COMPANY_NAMES[tickers[0]] || tickers[0];
  return {
    headline: template.headline.replace(/\{\{company\}\}/g, company),
    body: template.body.replace(/\{\{company\}\}/g, company),
  };
}

export function startSimulation(sessionId) {
  stopSimulation();
  activeSessionId = sessionId;
  recentEventKeys.set(sessionId, new Set());
  setTimeout(() => emitNextEvent(sessionId), 10_000);
  simulationInterval = setInterval(() => emitNextEvent(sessionId), NEXT_EVENT_INTERVAL_MS);
}

export function stopSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  simulationInterval = null;
  activeSessionId = null;
  recentEventKeys.clear();
}

export function getActiveSessionId() {
  return activeSessionId;
}

async function emitNextEvent(sessionId) {
  const db = getDb();
  const recent = recentEventKeys.get(sessionId) || new Set();

  let category;
  let sentiment;
  let t;
  let tickers;
  let key;
  let attempts = 0;
  const maxAttempts = 20;

  do {
    category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    sentiment = category.sentiments[Math.floor(Math.random() * category.sentiments.length)];
    const templates = TEMPLATES[category.id][sentiment];
    t = templates[Math.floor(Math.random() * templates.length)];
    tickers = pickTickers(category);
    const resolved = t.headline.includes('{{company}}') ? substituteCompany(t, tickers) : t;
    key = `${category.id}:${sentiment}:${resolved.headline}`;
    attempts++;
  } while (recent.has(key) && attempts < maxAttempts);

  recent.add(key);
  if (recent.size > 15) {
    const arr = [...recent];
    recent.clear();
    arr.slice(-8).forEach((k) => recent.add(k));
  }
  recentEventKeys.set(sessionId, recent);

  const resolved = t.headline.includes('{{company}}') ? substituteCompany(t, tickers) : t;
  const textForEmbedding = `${resolved.headline} ${resolved.body} ${category.label} ${sentiment} ${tickers.join(' ')}`;
  const embedding = await getEmbedding(textForEmbedding);

  const doc = {
    sessionId,
    headline: resolved.headline,
    body: resolved.body,
    category: category.id,
    categoryLabel: category.label,
    sentiment,
    tickers,
    publishedAt: new Date(),
    embedding: embedding || undefined,
  };
  const result = await db.collection('news_events').insertOne(doc);

  await db.collection('game_sessions').updateOne(
    { sessionId },
    { $set: { currentNewsEventId: result.insertedId.toString(), lastEventAt: new Date() } }
  );

  return { eventId: result.insertedId.toString(), headline: resolved.headline };
}
