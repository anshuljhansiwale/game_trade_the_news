'use client';

import { formatINR } from '@/lib/api';

export default function Portfolio({ portfolio, prices }) {
  if (!portfolio) return <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4 text-sm text-[var(--muted)]">Loading portfolio…</div>;

  const startValue = portfolio.startValue ?? portfolio.totalValue;
  const pct = startValue ? (((portfolio.totalValue - startValue) / startValue) * 100).toFixed(2) : '0.00';
  const isPositive = Number(pct) >= 0;

  return (
    <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-[var(--muted)] border-b border-[var(--border)]">Portfolio</h2>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-[var(--muted)]">Total value</span>
          <span className="font-mono text-lg font-semibold text-white">{formatINR(portfolio.totalValue ?? 0)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-[var(--muted)]">Return</span>
          <span className={`font-mono font-semibold ${isPositive ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>{pct}%</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-[var(--muted)]">Cash (available for trading)</span>
          <span className="font-mono text-white">{formatINR(portfolio.cash ?? 0)}</span>
        </div>
        {(portfolio.positions?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[var(--muted)] mb-2">Positions (Long & Short)</h3>
            <ul className="space-y-2">
              {portfolio.positions.map((pos) => {
                const price = prices[pos.symbol] ?? pos.avgCost;
                const value = price * pos.qty;
                const isShort = Number(pos.qty) < 0;
                const qtyDisplay = Math.abs(Number(pos.qty));
                return (
                  <li key={`${pos.symbol}-${pos.qty}`} className="flex justify-between text-sm items-center">
                    <span className="font-mono text-white">{pos.symbol === 'M_M' ? 'M&M' : pos.symbol}</span>
                    <span className="text-[var(--muted)]">
                      {isShort ? <span className="text-[var(--danger)]">Short {qtyDisplay}</span> : <span>Long {qtyDisplay}</span>}
                      {' @ '}{formatINR(price ?? 0, { maxFractionDigits: 2 })}
                    </span>
                    <span className={`font-mono ${isShort ? 'text-[var(--danger)]' : 'text-white'}`}>{formatINR(value)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
