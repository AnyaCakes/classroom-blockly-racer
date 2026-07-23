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
  /** Cancels any in-flight run and tells the scene to snap the robot back to start. Always safe to call, even mid-run. */
  resetRobot: () => void;
}

/**
 * Bridges the shared, Blockly-free `runProgram` generator to the
 * scene: emits `command:*`, waits for the matching `result:step`,
 * and only then pulls the next node. This is deliberately a strict
 * one-command-at-a-time handshake (not a fire-and-forget loop) so a
 * blocked/finished result can stop execution immediately rather than
 * racing ahead of what the robot actually did.
 */
export function useProgramRunner(bridge: Phaser.Events.EventEmitter): UseProgramRunnerResult {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<RunMessage | null>(null);
  const runTokenRef = useRef(0);
  const pendingHandlerRef = useRef<((step: RaceStep) => void) | null>(null);

  const cancelPending = useCallback(() => {
    if (pendingHandlerRef.current) {
      bridge.off('result:step', pendingHandlerRef.current);
      pendingHandlerRef.current = null;
    }
  }, [bridge]);

  const waitForResult = useCallback((): Promise<RaceStep> => {
    return new Promise((resolve) => {
      const handler = (step: RaceStep) => {
        pendingHandlerRef.current = null;
        resolve(step);
      };
      pendingHandlerRef.current = handler;
      bridge.once('result:step', handler);
    });
  }, [bridge]);

  const run = useCallback(
    (program: Program, onHighlight: (blockId: string | null) => void) => {
      if (running) return;
      const token = ++runTokenRef.current;

      void (async () => {
        setRunning(true);
        setMessage(null);

        for (const node of runProgram(program)) {
          if (runTokenRef.current !== token) return; // cancelled (Reset was clicked)

          onHighlight(node.blockId);
          bridge.emit(`command:${node.type}`);
          const step = await waitForResult();

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

  const resetRobot = useCallback(() => {
    runTokenRef.current += 1; // invalidates any in-flight run's checks above
    cancelPending();
    bridge.emit('command:resetToStart');
    setRunning(false);
    setMessage(null);
  }, [bridge, cancelPending]);

  return { running, message, run, resetRobot };
}
