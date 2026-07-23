import Phaser from 'phaser';
import { useRef } from 'react';
import type { MazeDefinition, SpriteColorId } from '@racer/shared';
import type { LobbyRole } from '../lobby/useRoom.js';
import { RaceCanvas } from './RaceCanvas.js';
import { BlocklyWorkspace, type BlocklyWorkspaceHandle } from '../../blockly/BlocklyWorkspace.js';
import { useProgramRunner } from './useProgramRunner.js';

interface Props {
  maze: MazeDefinition;
  role: LobbyRole;
  robotColor?: SpriteColorId;
  onResetRace: () => void;
}

export function RaceScreen({ maze, role, robotColor, onResetRace }: Props) {
  // One bridge instance per mount, shared between the canvas (which
  // hands it to the Phaser scene) and the program runner (which
  // emits command:* events into it, same as the old debug buttons did).
  const bridgeRef = useRef<Phaser.Events.EventEmitter>();
  if (!bridgeRef.current) {
    bridgeRef.current = new Phaser.Events.EventEmitter();
  }
  const blocklyRef = useRef<BlocklyWorkspaceHandle>(null);
  const { running, message, run, resetRobot } = useProgramRunner(bridgeRef.current);

  const handleRun = () => {
    const program = blocklyRef.current?.getProgram() ?? [];
    run(program, (blockId) => blocklyRef.current?.setHighlightedBlock(blockId));
  };

  const handleReset = () => {
    resetRobot();
    blocklyRef.current?.resetWorkspace();
  };

  return (
    <section>
      <h2>{maze.name}</h2>
      <RaceCanvas maze={maze} bridge={bridgeRef.current} robotColor={robotColor} />

      <div style={{ marginTop: '1rem' }}>
        <BlocklyWorkspace ref={blocklyRef} />
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={handleRun} disabled={running}>
          {running ? 'Running…' : '▶ Run'}
        </button>
        <button onClick={handleReset}>Reset</button>
        {role === 'teacher' && <button onClick={onResetRace}>End race, back to lobby</button>}
      </div>

      {message && (
        <p
          role="status"
          style={{
            marginTop: '0.5rem',
            color: message.kind === 'blocked' ? '#b45309' : '#15803d',
            fontWeight: 600,
          }}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
