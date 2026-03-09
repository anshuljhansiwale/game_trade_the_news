'use client';

export default function Leaderboard({ leaderboard, currentUserId }) {
  return (
    <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-[var(--muted)] border-b border-[var(--border)]">Leaderboard</h2>
      <ul className="divide-y divide-[var(--border)]">
        {!leaderboard?.length && <li className="px-4 py-3 text-sm text-[var(--muted)]">No entries yet.</li>}
        {leaderboard?.map((e, i) => {
          const isYou = e.userId === currentUserId;
          return (
            <li
              key={e.userId}
              className={`px-4 py-2 flex items-center justify-between text-sm ${isYou ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[var(--muted)] w-6">#{e.rank}</span>
                <span className={isYou ? 'font-semibold' : ''}>{e.userName ?? e.userId}</span>
              </span>
              <span className={`font-mono ${e.returnPct >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
                {e.returnPct >= 0 ? '+' : ''}{e.returnPct?.toFixed(2)}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
