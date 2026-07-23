import { useState } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { useRoom } from './features/lobby/useRoom.js';
import { useRace } from './features/race/useRace.js';
import { RoleSelectScreen } from './features/lobby/RoleSelectScreen.js';
import { CreateRoomScreen } from './features/lobby/CreateRoomScreen.js';
import { JoinRoomScreen } from './features/lobby/JoinRoomScreen.js';
import { LobbyScreen } from './features/lobby/LobbyScreen.js';
import { RaceScreen } from './features/race/RaceScreen.js';

type View = 'roleSelect' | 'creatingRoom' | 'joiningRoom' | 'lobby';

export function App() {
  const { socket, connected } = useSocket();
  const {
    room,
    role,
    error,
    myPlayer,
    createRoom,
    joinRoom,
    leaveRoom,
    removePlayer,
    startRace,
    resetRace,
    clearError,
  } = useRoom(socket, connected);
  const { maze } = useRace(room);
  const [view, setView] = useState<View>('roleSelect');

  const handleLeave = () => {
    leaveRoom();
    setView('roleSelect');
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 720 }}>
      <h1>Classroom Blockly Racer</h1>
      {!connected && <p style={{ color: 'crimson' }}>Connecting to server...</p>}

      {room?.status === 'racing' && maze ? (
        <RaceScreen maze={maze} role={role} robotColor={myPlayer?.color} onResetRace={resetRace} />
      ) : room ? (
        <LobbyScreen
          room={room}
          role={role}
          onLeave={handleLeave}
          onRemovePlayer={removePlayer}
          onStartRace={startRace}
        />
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
