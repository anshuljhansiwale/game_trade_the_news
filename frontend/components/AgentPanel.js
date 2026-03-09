'use client';

export default function AgentPanel({ latestNews, agentResult, loading, onAnalyze }) {
  return (
    <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--muted)]">AI analysis</h2>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!latestNews?.id || loading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Analyzing…' : 'Analyze current news'}
        </button>
      </div>
      <div className="p-4 min-h-[120px]">
        {!agentResult && !loading && (
          <p className="text-sm text-[var(--muted)]">Click “Analyze current news” to get AI impact and trade suggestions.</p>
        )}
        {loading && <p className="text-sm text-[var(--muted)]">Loading analysis…</p>}
        {agentResult && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[var(--muted)] mb-1">Analysis</h3>
              <div className="text-sm text-white whitespace-pre-wrap">{agentResult.analysis}</div>
            </div>
            {agentResult.suggestedTrades?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--muted)] mb-1">Suggested trades</h3>
                <ul className="list-disc list-inside text-sm text-[var(--accent)] space-y-1">
                  {agentResult.suggestedTrades.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {agentResult.analogues?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--muted)] mb-1">Historical analogues</h3>
                <ul className="text-xs text-[var(--muted)] space-y-0.5">
                  {agentResult.analogues.slice(0, 3).map((a, i) => (
                    <li key={i}>{a.headline}{a.score != null ? ` (${(a.score * 100).toFixed(0)}%)` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
