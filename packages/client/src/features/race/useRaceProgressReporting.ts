import { useEffect } from 'react';
import type Phaser from 'phaser';
import type { RaceStep } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';

/**
 * Listens to the same `result:step` events RaceScene emits for the
 * local program runner, and reports them to the server. This is a
 * second, independent subscriber on `bridge` - it doesn't interfere
 * with useProgramRunner's own commandId-matched listeners, since
 * Phaser's EventEmitter (like any EventEmitter) happily supports
 * multiple listeners for the same event.
 *
 * `active` is false during practice mode: practice-grid movement
 * isn't part of any race, so there's nothing useful to report (and
 * the practice maze has no goal, so 'finished' could never fire
 * there anyway).
 */
export function useRaceProgressReporting(
  bridge: Phaser.Events.EventEmitter,
  socket: AppSocket,
  roomCode: string,
  active: boolean
): void {
  useEffect(() => {
    if (!active) return;

    const handler = (_commandId: string | null, step: RaceStep) => {
      // Sensor checks ('if wall ahead') aren't a robot action - the
      // robot doesn't move or turn, so there's nothing for an
      // opponent-progress view to render. Reporting these would just
      // be noise on the wire and on the teacher's dashboard.
      if (step.action === 'sensor') return;

      socket.emit('race:progress', roomCode, step);
      if (step.action === 'finished') {
        // The timeMs argument is ignored server-side (see
        // RoomManager.recordFinish) - server computes its own
        // authoritative elapsed time. Sent as 0 rather than made
        // optional so the event's shape stays simple.
        socket.emit('race:finish', roomCode, 0);
      }
    };

    bridge.on('result:step', handler);
    return () => {
      bridge.off('result:step', handler);
    };
  }, [bridge, socket, roomCode, active]);
}
