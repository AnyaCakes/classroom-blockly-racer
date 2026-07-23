import { useState } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { useRoom } from './features/lobby/useRoom.js';
import { RoleSelectScreen } from './features/lobby/RoleSelectScreen.js';
import { CreateRoomScreen } from './features/lobby/CreateRoomScreen.js';
import { JoinRoomScreen } from './features/lobby/JoinRoomScreen.js';
import { LobbyScreen } from './features/lobby/LobbyScreen.js';

type View = 'roleSelect' | 'creatingRoom' | 'joiningRoom' | 'lobby';

export function App() {
  const { socket, connected } = useSocket();
  const { room, role, error, createRoom, joinRoom, leaveRoom, removePlayer, clearError } =
    useRoom(socket, connected);
  const [view, setView] = useState<View>('roleSelect');

  const handleLeave = () => {
    leaveRoom();
    setView('roleSelect');
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Classroom Blockly Racer</h1>
      {!connected && <p style={{ color: 'crimson' }}>Connecting to server...</p>}

      {room ? (
        <LobbyScreen room={room} role={role} onLeave={handleLeave} onRemovePlayer={removePlayer} />
      ) : view === 'roleSelect' ? (
        <RoleSelectScreen
          onSelectTeacher={() => setView('creatingRoom')}
          onSelectStudent={() => {
            clearError();
            setView('joiningRoom');
          }}
        />
      ) : view === 'creatingRoom' ? (
        <CreateRoomScreen onCreate={createRoom} />
      ) : (
        <JoinRoomScreen onJoin={joinRoom} error={error} />
      )}
    </main>
  );
}
