import { getSpriteColorHex, mazeRegistry, type RoomSnapshot } from '@racer/shared';
import { useState } from 'react';
import type { LobbyRole } from './useRoom.js';

interface Props {
  room: RoomSnapshot;
  role: LobbyRole;
  onLeave: () => void;
  onRemovePlayer: (playerId: string) => void;
  onStartRace: (mazeId: string) => void;
}

export function LobbyScreen({ room, role, onLeave, onRemovePlayer, onStartRace }: Props) {
  const mazeOptions = Object.values(mazeRegistry);
  const [selectedMazeId, setSelectedMazeId] = useState(mazeOptions[0]?.id ?? '');

  return (
    <section>
      <h2>Room {room.code}</h2>
      <p>
        {role === 'teacher'
          ? 'Share this code with your students.'
          : `Waiting for the teacher to start the race (status: ${room.status}).`}
      </p>

      <h3>Players ({room.players.length})</h3>
      <ul>
        {room.players.map((player) => (
          <li key={player.clientId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: `#${getSpriteColorHex(player.color).toString(16).padStart(6, '0')}`,
              }}
            />
            {player.nickname}
            {!player.connected && ' (disconnected)'}
            {role === 'teacher' && (
              <button onClick={() => onRemovePlayer(player.id)}>Remove</button>
            )}
          </li>
        ))}
        {room.players.length === 0 && <li>No students have joined yet.</li>}
      </ul>

      {role === 'teacher' && (
        <div style={{ marginTop: '1rem' }}>
          <label>
            Maze
            <select value={selectedMazeId} onChange={(e) => setSelectedMazeId(e.target.value)}>
              {mazeOptions.map((maze) => (
                <option key={maze.id} value={maze.id}>
                  {maze.name} ({maze.difficulty})
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => onStartRace(selectedMazeId)}
            disabled={!selectedMazeId}
            style={{ marginLeft: '0.5rem' }}
          >
            Start Race
          </button>
        </div>
      )}

      <button onClick={onLeave} style={{ marginTop: '1rem' }}>
        {role === 'teacher' ? 'End room' : 'Leave room'}
      </button>
    </section>
  );
}
