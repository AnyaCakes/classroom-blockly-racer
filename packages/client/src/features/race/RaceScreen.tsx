import Phaser from 'phaser';
import { useRef } from 'react';
import type { LeaderboardEntry, MazeDefinition, SpriteColorId } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';
import { RaceCanvas } from './RaceCanvas.js';
import { BlocklyWorkspace, type BlocklyWorkspaceHandle } from '../../blockly/BlocklyWorkspace.js';
import { useProgramRunner } from './useProgramRunner.js';
import { useRaceProgressReporting } from './useRaceProgressReporting.js';
import { LeaderboardPanel } from './LeaderboardPanel.js';

interface Props {
  maze: MazeDefinition;
  robotColor?: SpriteColorId;
  socket: AppSocket;
  roomCode: string;
  /** True once this student has already finished the current race - maze will be the practice grid, not the real race maze, in that case. */
  isPractice: boolean;
  /**
   * Lifted up to App (not computed here) so it survives the full
   * remount that happens when a student transitions into practice
   * mode (RaceScreen is keyed by maze id at the call site) - a
   * student who just finished still wants to see the results.
   */
  leaderboard: LeaderboardEntry[];
}

export function RaceScreen({ maze, robotColor, socket, roomCode, isPractice, leaderboard }: Props) {
  // One bridge instance per mount, shared between the canvas (which
  // hands it to the Phaser scene), the program runner (which emits
  // command:* events into it), and progress reporting (which listens
  // for the same result:step events the runner consumes, independently).
  const bridgeRef = useRef<Phaser.Events.EventEmitter>();
  if (!bridgeRef.current) {
    bridgeRef.current = new Phaser.Events.EventEmitter();
  }
  const blocklyRef = useRef<BlocklyWorkspaceHandle>(null);
  const { running, message, run, cancelRun, resetRobot } = useProgramRunner(bridgeRef.current);
  useRaceProgressReporting(bridgeRef.current, socket, roomCode, !isPractice);

  const handleRun = () => {
    const program = blocklyRef.current?.getProgram() ?? [];
    run(program, (blockId) => blocklyRef.current?.setHighlightedBlock(blockId));
  };

  // Two independent actions, deliberately not combined:
  //  - Reset Sprite: robot back to start, code untouched.
  //  - Clear Work Area: code wiped, robot untouched.
  // Both cancel any in-flight run, since letting execution continue
  // against a workspace that no longer matches (or a robot that just
  // teleported) would be confusing either way.
  const handleResetSprite = () => {
    resetRobot();
    blocklyRef.current?.setHighlightedBlock(null);
  };

  const handleClearWorkArea = () => {
    cancelRun();
    blocklyRef.current?.resetWorkspace();
  };

  return (
    <section>
      <h2>{maze.name}</h2>

      {isPractice && (
        <p style={{ background: '#eef6ff', border: '1px solid #bcd8f7', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
          🎉 You finished the race! Keep practicing freely here until your teacher starts the next one.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <RaceCanvas maze={maze} bridge={bridgeRef.current} robotColor={robotColor} />
        </div>
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <BlocklyWorkspace ref={blocklyRef} />
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={handleRun} disabled={running}>
          {running ? 'Running…' : '▶ Run'}
        </button>
        <button onClick={handleResetSprite}>Reset Sprite</button>
        <button onClick={handleClearWorkArea}>Clear Work Area</button>
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

      <LeaderboardPanel entries={leaderboard} />
    </section>
  );
}
