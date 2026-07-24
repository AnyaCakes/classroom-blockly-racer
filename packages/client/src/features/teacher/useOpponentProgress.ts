import { useEffect } from 'react';
import type Phaser from 'phaser';
import type { Player, RaceStep } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';
import type { SpectatorPlayerInfo } from '../../phaser/SpectatorScene.js';

function toSpectatorInfo(players: Player[]): SpectatorPlayerInfo[] {
  return players.map((p) => ({ clientId: p.clientId, color: p.color, connected: p.connected }));
}

export function useOpponentProgress(
  bridge: Phaser.Events.EventEmitter,
  socket: AppSocket,
  players: Player[]
): void {
  useEffect(() => {
    const handler = (clientId: string, step: RaceStep) => {
      bridge.emit('opponent:step', clientId, step);
    };
    socket.on('race:opponentProgress', handler);
    return () => {
      socket.off('race:opponentProgress', handler);
    };
  }, [bridge, socket]);

  // Re-syncs the scene's robots whenever the roster's connection
  // status (or, in principle, colors) changes - this is how a
  // student's robot dims when they drop and brightens when they
  // reconnect, without the dashboard's Phaser instance ever
  // remounting.
  useEffect(() => {
    bridge.emit('players:sync', toSpectatorInfo(players));
    // players is a new array reference on every room:state broadcast,
    // so this intentionally re-fires often - each call is cheap
    // (SpectatorScene just updates alpha per robot).
  }, [bridge, players]);
}
