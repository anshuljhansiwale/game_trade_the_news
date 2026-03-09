'use client';

export default function NewsFeed({ latest, history }) {
  return (
    <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-[var(--muted)] border-b border-[var(--border)]">News feed</h2>
      {latest ? (
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">{latest.categoryLabel || latest.category}</span>
            <span className="text-xs text-[var(--muted)]">{latest.sentiment}</span>
            <span className="text-xs text-[var(--muted)] ml-auto">
              {latest.publishedAt ? new Date(latest.publishedAt).toLocaleTimeString() : ''}
            </span>
          </div>
          <h3 className="font-semibold text-white mb-2">{latest.headline}</h3>
          <p className="text-sm text-[var(--muted)]">{latest.body}</p>
          {latest.tickers?.length > 0 && (
            <p className="mt-2 text-xs text-[var(--muted)]">Tickers: {latest.tickers.join(', ')}</p>
          )}
        </div>
      ) : (
        <div className="p-4 text-sm text-[var(--muted)]">Waiting for first news event…</div>
      )}
      {history?.length > 1 && (
        <ul className="divide-y divide-[var(--border)] max-h-48 overflow-y-auto">
          {history.slice(1, 6).map((e) => (
            <li key={e.id || e._id} className="px-4 py-2 text-sm">
              <span className="text-[var(--muted)]">{e.publishedAt ? new Date(e.publishedAt).toLocaleTimeString() : ''}</span>
              <span className="ml-2 text-white truncate block">{e.headline}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
