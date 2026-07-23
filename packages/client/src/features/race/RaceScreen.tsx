import Phaser from 'phaser';
import { useRef } from 'react';
import type { MazeDefinition } from '@racer/shared';
import type { LobbyRole } from '../lobby/useRoom.js';
import { RaceCanvas } from './RaceCanvas.js';
import { DebugControls } from './DebugControls.js';

interface Props {
  maze: MazeDefinition;
  role: LobbyRole;
  onResetRace: () => void;
}

export function RaceScreen({ maze, role, onResetRace }: Props) {
  // One bridge instance per mount, shared between the canvas (which
  // hands it to the Phaser scene) and the debug controls (which emit
  // commands into it). Milestone 4 replaces DebugControls with the
  // interpreter as the thing emitting into this same bridge.
  const bridgeRef = useRef<Phaser.Events.EventEmitter>();
  if (!bridgeRef.current) {
    bridgeRef.current = new Phaser.Events.EventEmitter();
  }

  return (
    <section>
      <h2>{maze.name}</h2>
      <RaceCanvas maze={maze} bridge={bridgeRef.current} />
      <DebugControls bridge={bridgeRef.current} />
      {role === 'teacher' && (
        <button onClick={onResetRace} style={{ marginTop: '1rem' }}>
          End race, back to lobby
        </button>
      )}
    </section>
  );
}
