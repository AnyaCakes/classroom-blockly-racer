import { useCallback, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Program, RaceStep } from '@racer/shared';
import { runProgram } from '@racer/shared';

export interface RunMessage {
  kind: 'blocked' | 'finished';
  text: string;
}

interface UseProgramRunnerResult {
  running: boolean;
  message: RunMessage | null;
  run: (program: Program, onHighlight: (blockId: string | null) => void) => void;
  /** Cancels any in-flight run without touching the robot's position - used by "Clear Work Area". */
  cancelRun: () => void;
  /** Cancels any in-flight run AND tells the scene to snap the robot back to start - used by "Reset Sprite". */
  resetRobot: () => void;
}

let commandSeq = 0;

/**
 * Bridges the shared, Blockly-free `runProgram` generator to the
 * scene: emits `command:*` with a unique commandId, waits for the
 * `result:step` carrying that exact id, and only then pulls the next
 * node. The commandId check (not just "the next result:step event")
 * is what guarantees a stale or mistimed event can never be mistaken
 * for the answer to the command currently in flight - in particular,
 * it means the 1.5s wall-collision shake in RaceScene genuinely
 * blocks the next block from running, because nothing here advances
 * until the result carrying *this* command's id arrives, however
 * long that takes.
 */
export function useProgramRunner(bridge: Phaser.Events.EventEmitter): UseProgramRunnerResult {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<RunMessage | null>(null);
  const runTokenRef = useRef(0);
  const pendingRef = useRef<{ commandId: string; handler: (id: string | null, step: RaceStep) => void } | null>(null);

  const cancelPending = useCallback(() => {
    if (pendingRef.current) {
      bridge.off('result:step', pendingRef.current.handler);
      pendingRef.current = null;
    }
  }, [bridge]);

  const waitForResult = useCallback(
    (commandId: string): Promise<RaceStep> => {
      return new Promise((resolve) => {
        const handler = (resultId: string | null, step: RaceStep) => {
          if (resultId !== commandId) return; // not our command - ignore, keep waiting
          bridge.off('result:step', handler);
          pendingRef.current = null;
          resolve(step);
        };
        pendingRef.current = { commandId, handler };
        bridge.on('result:step', handler);
      });
    },
    [bridge]
  );

  const run = useCallback(
    (program: Program, onHighlight: (blockId: string | null) => void) => {
      if (running) return;
      const token = ++runTokenRef.current;

      void (async () => {
        setRunning(true);
        setMessage(null);

        for (const node of runProgram(program)) {
          if (runTokenRef.current !== token) return; // cancelled (Reset/Clear was clicked)

          const commandId = String(++commandSeq);
          onHighlight(node.blockId);
          const resultPromise = waitForResult(commandId);
          bridge.emit(`command:${node.type}`, commandId);
          const step = await resultPromise;

          if (runTokenRef.current !== token) return; // cancelled while waiting on this step

          if (step.action === 'blocked') {
            setMessage({
              kind: 'blocked',
              text:
                step.reason === 'wall'
                  ? "Oops - there's a wall there! Check the highlighted block."
                  : 'That would go off the edge of the maze! Check the highlighted block.',
            });
            setRunning(false);
            return;
          }

          if (step.action === 'finished') {
            onHighlight(null);
            setMessage({ kind: 'finished', text: 'You reached the goal!' });
            setRunning(false);
            return;
          }
        }

        onHighlight(null);
        setRunning(false);
      })();
    },
    [running, bridge, waitForResult]
  );

  const cancelRun = useCallback(() => {
    runTokenRef.current += 1; // invalidates any in-flight run's checks above
    cancelPending();
    setRunning(false);
    setMessage(null);
  }, [cancelPending]);

  const resetRobot = useCallback(() => {
    cancelRun();
    bridge.emit('command:resetToStart');
  }, [bridge, cancelRun]);

  return { running, message, run, cancelRun, resetRobot };
}
