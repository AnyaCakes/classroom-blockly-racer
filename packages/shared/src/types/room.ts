import type { SpriteColorId } from './sprite.js';

/**
 * A student in a room. `id` is the socket-assigned connection id;
 * `clientId` is a persistent id the client stores itself (sessionStorage)
 * so a refreshed/reconnected tab can be matched back to the same player.
 */
export interface Player {
  id: string;
  clientId: string;
  nickname: string;
  color: SpriteColorId;
  connected: boolean;
  joinedAt: number;
}

export type RoomStatus = 'lobby' | 'racing' | 'finished' | 'abandoned';

export interface Room {
  code: string;
  /** Current socket id of the teacher; empty string while disconnected. */
  teacherId: string;
  /** Persistent id used to match a reconnecting teacher back to this room. */
  teacherClientId: string;
  teacherConnected: boolean;
  status: RoomStatus;
  players: Player[];
  currentMazeId: string | null;
  createdAt: number;
}

export type JoinFailureReason =
  | 'room_not_found'
  | 'room_in_progress'
  | 'room_abandoned'
  | 'nickname_taken'
  | 'nickname_invalid';

export type JoinResult =
  | { ok: true; room: RoomSnapshot; player: Player }
  | { ok: false; reason: JoinFailureReason };

/**
 * The subset of Room state that's safe/useful to send to clients.
 * Defined separately from Room (even though identical today) so we
 * can redact server-only fields later without changing call sites
 * that consume RoomSnapshot.
 */
export type RoomSnapshot = Room;
