import type { LeaderboardEntry } from '@racer/shared';

interface Props {
  entries: LeaderboardEntry[];
}

export function LeaderboardPanel({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: 8, maxWidth: 320 }}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>🏁 Leaderboard</h3>
      <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {entries.map((entry) => (
          <li key={entry.playerId}>
            {entry.nickname} — {(entry.timeMs / 1000).toFixed(1)}s
          </li>
        ))}
      </ol>
    </div>
  );
}
