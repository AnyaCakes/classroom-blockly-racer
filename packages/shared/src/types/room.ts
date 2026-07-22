/**
 * A student in a room. `id` is the socket-assigned connection id;
 * `clientId` is a persistent id the client stores itself (sessionStorage)
 * so a refreshed/reconnected tab can be matched back to the same player.
 */
export interface Player {
  id: string;
  clientId: string;
  nickname: string;
  connected: boolean;
  joinedAt: number;
}

export type RoomStatus = 'lobby' | 'racing' | 'finished';

export interface Room {
  code: string;
  teacherId: string;
  status: RoomStatus;
  players: Player[];
  currentMazeId: string | null;
  createdAt: number;
}

export type JoinFailureReason =
  | 'room_not_found'
  | 'room_in_progress'
  | 'nickname_taken'
  | 'nickname_invalid';

export type JoinResult =
  | { ok: true; room: RoomSnapshot; player: Player }
  | { ok: false; reason: JoinFailureReason };

/**
 * The subset of Room state that's safe/useful to send to clients.
 * (Kept identical to Room for now, but defined separately so we can
 * redact server-only fields later without changing call sites.)
 */
export type RoomSnapshot = Omit<Room, 'teacherId'> & { teacherId: string };
