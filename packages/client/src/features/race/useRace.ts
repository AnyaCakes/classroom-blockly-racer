import { useMemo } from 'react';
import type { MazeDefinition, RoomSnapshot } from '@racer/shared';
import { getMazeById } from '@racer/shared';

/**
 * Derives the active maze from room.currentMazeId rather than
 * listening for the one-shot `race:started` event. This matters for
 * two cases the event alone can't cover: a student joining a room
 * that's already mid-race, and a student reconnecting mid-race -
 * neither replays `race:started`, but room:state (the canonical,
 * always-rebroadcast source of truth) carries currentMazeId either way.
 */
export function useRace(room: RoomSnapshot | null): { maze: MazeDefinition | null } {
  const maze = useMemo(() => {
    if (!room?.currentMazeId) return null;
    return getMazeById(room.currentMazeId) ?? null;
  }, [room?.currentMazeId]);

  return { maze };
}
