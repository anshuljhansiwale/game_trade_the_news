'use client';

import { useEffect, useState } from 'react';

export default function Countdown({ targetMs, intervalMs = 1000 }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (targetMs == null) return;
    function tick() {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((targetMs - now) / 1000));
      setSecondsLeft(left);
    }
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [targetMs, intervalMs]);

  if (secondsLeft == null) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
      <span className="text-sm text-[var(--muted)]">Next news in</span>
      <span className="font-mono text-lg font-semibold text-[var(--accent)]">{secondsLeft}s</span>
    </div>
  );
}
