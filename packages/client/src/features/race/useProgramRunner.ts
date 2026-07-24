import { useCallback, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Program, RaceStep } from '@racer/shared';
import { runProgram } from '@racer/shared';

export interface RunMessage {
  kind: 'blocked' | 'finished' | 'incomplete';
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
 * scene. Drives the generator MANUALLY (gen.next(answer)) rather than
 * a plain `for...of` loop, because `if` nodes need a real answer sent
 * back before the generator knows which branch to walk - `for...of`
 * only ever calls `.next()` with no argument, which can't support
 * that. Every `command:*` emission carries a unique commandId, echoed
 * back on the matching `result:step`, so a stale or mistimed event
 * can never be mistaken for the answer currently being waited on -
 * this is what makes the 1.5s wall-collision shake in RaceScene
 * genuinely block the next block from starting, however long it
 * takes.
 *
 * A 'blocked' result is a timed penalty, not a stop condition: once
 * the shake resolves and the result arrives, execution continues to
 * the next block in the program. Only 'finished' (reached the goal)
 * or an explicit cancel (Reset Sprite / Clear Work Area) actually
 * end a run early.
 *
 * If a run exhausts every block WITHOUT reaching the goal, it
 * auto-resets the robot back to the maze's start (same command Reset
 * Sprite uses) rather than leaving it wherever execution stopped.
 * This is deliberate: previously, clicking Run again after an
 * unsuccessful run continued from that resting position, which let a
 * student incrementally nudge the robot forward across several Run
 * clicks without ever reasoning about the whole program at once.
 * Auto-resetting means every Run click is a genuine full attempt from
 * the top - Reset Sprite's role shifts accordingly, from "clean up
 * after a failed run" (now automatic) to "abort a run that's still in
 * progress" (its cancelRun call already supported this from the
 * start, unrelated to this change).
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

        const generator = runProgram(program);
        // First call takes no input - there's nothing to answer yet.
        let step = generator.next();

        while (!step.done) {
          if (runTokenRef.current !== token) return; // cancelled (Reset/Clear was clicked)

          const yielded = step.value;
          const commandId = String(++commandSeq);

          if (yielded.kind === 'command') {
            onHighlight(yielded.node.blockId);
            const resultPromise = waitForResult(commandId);
            bridge.emit(`command:${yielded.node.type}`, commandId);
            const result = await resultPromise;

            if (runTokenRef.current !== token) return; // cancelled while waiting on this step

            if (result.action === 'blocked') {
              // The 1.5s shake (already waited out above, since this
              // result only arrives after RaceScene's delayedCall
              // fires) IS the penalty - it doesn't also stop the
              // program. Show what happened and keep going.
              setMessage({
                kind: 'blocked',
                text:
                  result.reason === 'wall'
                    ? "Hit a wall! Lost 1.5 seconds - continuing with the next block."
                    : "Tried to go off the edge! Lost 1.5 seconds - continuing with the next block.",
              });
              step = generator.next(); // a command yield needs no answer
              continue;
            }

            if (result.action === 'finished') {
              onHighlight(null);
              setMessage({ kind: 'finished', text: 'You reached the goal!' });
              setRunning(false);
              return;
            }

            // A normal successful step (moved/turned) - clear any
            // stale blocked message from an earlier collision in
            // this same run.
            setMessage(null);
            step = generator.next();
          } else {
            // 'sensorCheck' - the generator is paused waiting for a
            // real answer, not just permission to continue.
            onHighlight(yielded.blockId);
            const resultPromise = waitForResult(commandId);
            bridge.emit('command:checkWallAhead', commandId);
            const result = await resultPromise;

            if (runTokenRef.current !== token) return;

            const answer = result.action === 'sensor' ? result.result : false;
            step = generator.next(answer);
          }
        }

        // The generator finished (every block executed) without ever
        // hitting 'finished' - the program didn't solve the maze.
        // Auto-reset back to start rather than leaving the robot
        // wherever it happened to stop: otherwise clicking Run again
        // would silently continue from that resting position instead
        // of being a genuine fresh attempt.
        onHighlight(null);
        bridge.emit('command:resetToStart');
        setMessage({
          kind: 'incomplete',
          text: "Your program finished, but you didn't reach the goal - the sprite has been reset. Fix your code and try again!",
        });
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
