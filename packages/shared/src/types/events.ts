import type { JoinResult, Player, RoomSnapshot } from './room.js';
import type { MazeDefinition, RaceStep } from './maze.js';
import type { SpriteColorId } from './sprite.js';

export interface ClientToServerEvents {
  'room:create': (
    clientId: string,
    cb: (result: { roomCode: string; room: RoomSnapshot }) => void
  ) => void;
  'room:join': (
    roomCode: string,
    nickname: string,
    color: SpriteColorId,
    clientId: string,
    cb: (result: JoinResult) => void
  ) => void;
  /** Teacher reconnecting to a room they previously created (e.g. after a refresh). */
  'room:rejoinTeacher': (
    roomCode: string,
    clientId: string,
    cb: (result: TeacherRejoinResult) => void
  ) => void;
  /** Voluntary leave - distinct from a network disconnect, which starts the grace-period timer instead. */
  'room:leave': (roomCode: string) => void;
  /** Teacher-only: forcibly removes a (usually long-disconnected) student. */
  'room:removePlayer': (roomCode: string, playerId: string) => void;
  'race:start': (roomCode: string, mazeId: string) => void;
  'race:progress': (roomCode: string, step: RaceStep) => void;
  'race:finish': (roomCode: string, timeMs: number) => void;
  'race:reset': (roomCode: string) => void;
}

export interface ServerToClientEvents {
  /** Canonical room state, re-broadcast to everyone in the room on any roster change. */
  'room:state': (room: RoomSnapshot) => void;
  /** Supplementary notifications for UI moments (toasts, sounds) - room:state remains the source of truth. */
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:error': (message: string) => void;
  'race:started': (maze: MazeDefinition) => void;
  'race:opponentProgress': (playerId: string, step: RaceStep) => void;
  'race:leaderboard': (results: LeaderboardEntry[]) => void;
}

export type TeacherRejoinResult =
  | { ok: true; room: RoomSnapshot }
  | { ok: false; reason: 'room_not_found' | 'not_teacher_of_room' };

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  timeMs: number;
  rank: number;
}

/** No inter-server communication in V1; reserved for future scaling. */
export type InterServerEvents = Record<string, never>;

export interface SocketData {
  clientId: string;
  roomCode: string | null;
}
