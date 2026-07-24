import type { LeaderboardEntry, Player } from '@racer/shared';
import { getSpriteColorHex } from '@racer/shared';

interface Props {
  players: Player[];
  leaderboard: LeaderboardEntry[];
  onRemovePlayer: (playerId: string) => void;
}

export function TeacherLeaderboardPanel({ players, leaderboard, onRemovePlayer }: Props) {
  const finished = players
    .map((player) => ({ player, entry: leaderboard.find((e) => e.nickname === player.nickname) }))
    .filter((row): row is { player: Player; entry: LeaderboardEntry } => row.entry !== undefined)
    .sort((a, b) => a.entry.rank - b.entry.rank);

  const unfinished = players
    .filter((player) => !leaderboard.some((e) => e.nickname === player.nickname))
    .sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: 8, maxWidth: 420 }}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>🏁 Leaderboard ({players.length} student{players.length === 1 ? '' : 's'})</h3>
      <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {finished.map(({ player, entry }) => (
          <PlayerRow key={player.clientId} player={player} timeLabel={`${(entry.timeMs / 1000).toFixed(1)}s`} onRemove={onRemovePlayer} />
        ))}
      </ol>
      {unfinished.length > 0 && (
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', listStyle: 'none' }}>
          {unfinished.map((player) => (
            <PlayerRow key={player.clientId} player={player} timeLabel="Unfinished" muted onRemove={onRemovePlayer} />
          ))}
        </ul>
      )}
      {players.length === 0 && <p style={{ margin: 0, color: '#888' }}>No students have joined yet.</p>}
    </div>
  );
}

function PlayerRow({
  player,
  timeLabel,
  muted,
  onRemove,
}: {
  player: Player;
  timeLabel: string;
  muted?: boolean;
  onRemove: (playerId: string) => void;
}) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: muted ? '#888' : undefined }}>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: `#${getSpriteColorHex(player.color).toString(16).padStart(6, '0')}`,
          opacity: player.connected ? 1 : 0.35,
        }}
      />
      <span>{player.nickname}</span>
      {!player.connected && <span style={{ fontSize: '0.8em' }}>(disconnected)</span>}
      <span style={{ marginLeft: 'auto' }}>{timeLabel}</span>
      <button onClick={() => onRemove(player.id)} style={{ fontSize: '0.8em' }}>
        Remove
      </button>
    </li>
  );
}
