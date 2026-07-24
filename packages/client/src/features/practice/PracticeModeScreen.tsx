import { useState } from 'react';
import type { MazeDefinition } from '@racer/shared';
import { DEFAULT_SPRITE_COLOR, mazeRegistry, practiceMaze } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';
import { RaceScreen } from '../race/RaceScreen.js';

interface Props {
  socket: AppSocket;
  onExit: () => void;
}

/** Every maze available to poke around with solo - the real puzzles plus the open practice grid. */
const PRACTICE_OPTIONS: MazeDefinition[] = [...Object.values(mazeRegistry), practiceMaze];

export function PracticeModeScreen({ socket, onExit }: Props) {
  const [selectedMazeId, setSelectedMazeId] = useState<string | null>(null);
  const selectedMaze = selectedMazeId ? PRACTICE_OPTIONS.find((m) => m.id === selectedMazeId) : null;

  if (!selectedMaze) {
    return (
      <section>
        <h2>Practice Mode</h2>
        <p>Pick any maze to try on your own - no room, no teacher, no leaderboard.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {PRACTICE_OPTIONS.map((maze) => (
            <li key={maze.id} style={{ marginBottom: '0.5rem' }}>
              <button onClick={() => setSelectedMazeId(maze.id)} style={{ width: '100%', textAlign: 'left' }}>
                {maze.name} <span style={{ color: '#888' }}>({maze.difficulty})</span>
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onExit}>← Back to menu</button>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button onClick={() => setSelectedMazeId(null)}>← Choose a different maze</button>
        <button onClick={onExit}>Exit practice mode</button>
      </div>
      <RaceScreen
        // Forces a clean remount when switching mazes within practice
        // mode, same reasoning as the race<->practice-grid remount in
        // App.tsx - fresh Phaser instance and Blockly workspace per maze.
        key={selectedMaze.id}
        maze={selectedMaze}
        robotColor={DEFAULT_SPRITE_COLOR}
        socket={socket}
        roomCode=""
        isPractice
        leaderboard={[]}
      />
    </section>
  );
}
