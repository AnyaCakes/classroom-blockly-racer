import type { JoinResult, Player, RoomSnapshot } from './room.js';
import type { MazeDefinition, RaceStep } from './maze.js';

export interface ClientToServerEvents {
  'room:create': (teacherName: string, cb: (roomCode: string) => void) => void;
  'room:join': (
    roomCode: string,
    nickname: string,
    clientId: string,
    cb: (result: JoinResult) => void
  ) => void;
  'race:start': (roomCode: string, mazeId: string) => void;
  'race:progress': (roomCode: string, step: RaceStep) => void;
  'race:finish': (roomCode: string, timeMs: number) => void;
  'race:reset': (roomCode: string) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomSnapshot) => void;
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (playerId: string) => void;
  'race:started': (maze: MazeDefinition) => void;
  'race:opponentProgress': (playerId: string, step: RaceStep) => void;
  'race:leaderboard': (results: LeaderboardEntry[]) => void;
}

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
