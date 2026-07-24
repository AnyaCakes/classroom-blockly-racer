import { useState } from 'react';
import { practiceMaze } from '@racer/shared';
import { useSocket } from './hooks/useSocket.js';
import { useRoom } from './features/lobby/useRoom.js';
import { useRace } from './features/race/useRace.js';
import { useLeaderboard } from './features/race/useLeaderboard.js';
import { RoleSelectScreen } from './features/lobby/RoleSelectScreen.js';
import { CreateRoomScreen } from './features/lobby/CreateRoomScreen.js';
import { JoinRoomScreen } from './features/lobby/JoinRoomScreen.js';
import { LobbyScreen } from './features/lobby/LobbyScreen.js';
import { RaceScreen } from './features/race/RaceScreen.js';
import { TeacherDashboardScreen } from './features/teacher/TeacherDashboardScreen.js';

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
  const { maze: raceMaze } = useRace(room);
  const [view, setView] = useState<View>('roleSelect');

  // Keyed to the room's actual race maze (not whichever maze is
  // currently displayed) so it survives a student's individual
  // transition into practice mode, and only resets when the teacher
  // genuinely starts a new race.
  const leaderboard = useLeaderboard(socket, room?.currentMazeId ?? '');

  const handleLeave = () => {
    leaveRoom();
    setView('roleSelect');
  };

  // A student who has already finished the current race practices
  // freely on an open grid instead of sitting idle - same maze for
  // every finished student, teacher included if they ever "play".
  const isPractice = myPlayer?.finished ?? false;
  const activeMaze = isPractice ? practiceMaze : raceMaze;

  const isRacing = room?.status === 'racing' && activeMaze !== null;

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: isRacing ? 1100 : 720 }}>
      <h1>Classroom Blockly Racer</h1>
      {!connected && <p style={{ color: 'crimson' }}>Connecting to server...</p>}

      {room?.status === 'racing' && activeMaze ? (
        role === 'teacher' ? (
          <TeacherDashboardScreen
            key={activeMaze.id}
            maze={activeMaze}
            roomCode={room.code}
            raceStartedAt={room.raceStartedAt}
            players={room.players}
            leaderboard={leaderboard}
            socket={socket}
            onRemovePlayer={removePlayer}
            onResetRace={resetRace}
          />
        ) : (
          <RaceScreen
            // Forces a clean remount (fresh Phaser game, fresh Blockly
            // workspace) when a student's activeMaze switches between
            // the real race maze and the practice grid - simpler and
            // more robust than trying to hot-swap the maze inside a
            // single long-lived RaceScreen instance.
            key={activeMaze.id}
            maze={activeMaze}
            robotColor={myPlayer?.color}
            socket={socket}
            roomCode={room.code}
            isPractice={isPractice}
            leaderboard={leaderboard}
          />
        )
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
