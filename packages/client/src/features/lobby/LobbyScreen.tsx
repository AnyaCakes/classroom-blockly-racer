import type { RoomSnapshot } from '@racer/shared';
import type { LobbyRole } from './useRoom.js';

interface Props {
  room: RoomSnapshot;
  role: LobbyRole;
  onLeave: () => void;
  onRemovePlayer: (playerId: string) => void;
}

export function LobbyScreen({ room, role, onLeave, onRemovePlayer }: Props) {
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
          <li key={player.clientId}>
            {player.nickname}
            {!player.connected && ' (disconnected)'}
            {role === 'teacher' && (
              <button onClick={() => onRemovePlayer(player.id)} style={{ marginLeft: '0.5rem' }}>
                Remove
              </button>
            )}
          </li>
        ))}
        {room.players.length === 0 && <li>No students have joined yet.</li>}
      </ul>

      <button onClick={onLeave}>{role === 'teacher' ? 'End room' : 'Leave room'}</button>
    </section>
  );
}
