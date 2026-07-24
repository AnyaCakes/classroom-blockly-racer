import Phaser from 'phaser';
import { useRef } from 'react';
import type { LeaderboardEntry, MazeDefinition, Player } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';
import { TeacherDashboardCanvas } from './TeacherDashboardCanvas.js';
import { useOpponentProgress } from './useOpponentProgress.js';
import { useElapsedTime } from './useElapsedTime.js';
import { TeacherLeaderboardPanel } from './TeacherLeaderboardPanel.js';

interface Props {
  maze: MazeDefinition;
  roomCode: string;
  raceStartedAt: number | null;
  players: Player[];
  leaderboard: LeaderboardEntry[];
  socket: AppSocket;
  onRemovePlayer: (playerId: string) => void;
  onResetRace: () => void;
}

export function TeacherDashboardScreen({
  maze,
  roomCode,
  raceStartedAt,
  players,
  leaderboard,
  socket,
  onRemovePlayer,
  onResetRace,
}: Props) {
  const bridgeRef = useRef<Phaser.Events.EventEmitter>();
  if (!bridgeRef.current) {
    bridgeRef.current = new Phaser.Events.EventEmitter();
  }
  useOpponentProgress(bridgeRef.current, socket, players);
  const elapsed = useElapsedTime(raceStartedAt);

  return (
    <section>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Room {roomCode}</h2>
        <span>{maze.name}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>⏱ {elapsed}</span>
        <button onClick={onResetRace} style={{ marginLeft: 'auto' }}>
          End race, back to lobby
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start', marginTop: '1rem' }}>
        <TeacherDashboardCanvas
          maze={maze}
          bridge={bridgeRef.current}
          initialPlayers={players.map((p) => ({ clientId: p.clientId, color: p.color, connected: p.connected }))}
        />
        <TeacherLeaderboardPanel players={players} leaderboard={leaderboard} onRemovePlayer={onRemovePlayer} />
      </div>
    </section>
  );
}
