'use client';

import { useState, useEffect } from 'react';
import { getSymbols, formatINR } from '@/lib/api';

const FALLBACK_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT', 'TATAMOTORS'];

export default function TradeForm({ portfolio, prices, onOrder }) {
  const [symbols, setSymbols] = useState(FALLBACK_SYMBOLS);
  const [symbol, setSymbol] = useState('RELIANCE');
  const [side, setSide] = useState('buy');
  const [qty, setQty] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSymbols()
      .then((data) => {
        if (data?.symbols?.length) setSymbols(data.symbols);
      })
      .catch(() => {});
  }, []);

  const price = prices[symbol] ?? 100;
  const notional = price * (parseInt(qty, 10) || 0);
  const canBuy = portfolio?.cash >= notional && notional > 0;
  const numQty = parseInt(qty, 10) || 0;
  const canSell = numQty > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const numQty = parseInt(qty, 10);
    if (!numQty || numQty <= 0) return;
    setSubmitting(true);
    try {
      await onOrder(symbol, side, numQty);
      setQty('10');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-[var(--muted)] border-b border-[var(--border)]">Place order</h2>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol (NIFTY 50)</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>{s === 'M_M' ? 'M&M' : s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Side</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${side === 'buy' ? 'bg-[var(--accent)] text-black' : 'bg-[var(--border)] text-[var(--muted)]'}`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${side === 'sell' ? 'bg-[var(--danger)] text-white' : 'bg-[var(--border)] text-[var(--muted)]'}`}
            >
              Sell
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            ~{formatINR(notional)} @ {formatINR(price ?? 0, { maxFractionDigits: 2 })}
            {side === 'sell' && <span className="block mt-0.5">Short selling allowed — cash increases when you short</span>}
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting || numQty <= 0 || (side === 'buy' && !canBuy)}
          className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)]"
        >
          {submitting ? '...' : side === 'buy' ? 'Buy' : 'Sell'}
        </button>
      </form>
    </section>
  );
}
