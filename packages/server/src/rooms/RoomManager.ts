import type { JoinFailureReason, JoinResult, Player, Room } from '@racer/shared';
import { generateUniqueRoomCode } from './roomCode.js';

const DEFAULT_GRACE_PERIOD_MS = 30_000;

type TimerKey = string; // `${roomCode}:${clientId}`

/**
 * In-memory room store and the full room lifecycle: creation, joining,
 * voluntary leaving, and reconnection. Rooms are ephemeral (a class
 * period), so this intentionally holds everything in process memory
 * rather than a database - see the Milestone 1 note in this file's
 * predecessor for the reasoning.
 *
 * Reconnection design: every player (and the teacher) has a
 * server-generated `id` (their current socket id) and a client-
 * generated `clientId` (persisted in the browser's sessionStorage).
 * A disconnect doesn't remove anyone immediately - it flips
 * `connected: false` and starts a grace-period timer. If the same
 * `clientId` reconnects before the timer fires, we cancel the timer
 * and update their `id` to the new socket - same player, new pipe.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private disconnectTimers = new Map<TimerKey, NodeJS.Timeout>();

  constructor(private readonly gracePeriodMs: number = DEFAULT_GRACE_PERIOD_MS) {}

  // ---------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  count(): number {
    return this.rooms.size;
  }

  // ---------------------------------------------------------------------
  // Teacher lifecycle
  // ---------------------------------------------------------------------

  createRoom(teacherSocketId: string, teacherClientId: string): Room {
    const code = generateUniqueRoomCode((c) => this.rooms.has(c));
    const room: Room = {
      code,
      teacherId: teacherSocketId,
      teacherClientId,
      teacherConnected: true,
      status: 'lobby',
      players: [],
      currentMazeId: null,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  /** Returns the room if `clientId` is indeed the teacher of `code`, updating its socket id. */
  reconnectTeacher(code: string, teacherClientId: string, newSocketId: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room || room.teacherClientId !== teacherClientId) return undefined;

    this.cancelDisconnectTimer(code, teacherClientId);
    room.teacherId = newSocketId;
    room.teacherConnected = true;
    if (room.status === 'abandoned') room.status = 'lobby';
    return room;
  }

  markTeacherDisconnected(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    room.teacherConnected = false;
    this.scheduleRemoval(code, room.teacherClientId, () => {
      const current = this.rooms.get(code);
      if (current && !current.teacherConnected) {
        current.status = 'abandoned';
      }
    });
  }

  // ---------------------------------------------------------------------
  // Student lifecycle
  // ---------------------------------------------------------------------

  joinRoom(
    code: string,
    socketId: string,
    clientId: string,
    nickname: string
  ): JoinResult {
    const room = this.rooms.get(code);
    if (!room || room.status === 'abandoned') {
      return this.failure('room_not_found');
    }

    const existing = room.players.find((p) => p.clientId === clientId);
    if (existing) {
      // Reconnecting player, not a new join.
      this.cancelDisconnectTimer(code, clientId);
      existing.id = socketId;
      existing.connected = true;
      return { ok: true, room, player: existing };
    }

    if (room.status !== 'lobby') {
      return this.failure('room_in_progress');
    }

    const trimmed = nickname.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      return this.failure('nickname_invalid');
    }

    const nicknameTaken = room.players.some(
      (p) => p.nickname.toLowerCase() === trimmed.toLowerCase()
    );
    if (nicknameTaken) {
      return this.failure('nickname_taken');
    }

    const player: Player = {
      id: socketId,
      clientId,
      nickname: trimmed,
      connected: true,
      joinedAt: Date.now(),
    };
    room.players.push(player);
    return { ok: true, room, player };
  }

  /** Voluntary leave - removes immediately, no grace period. */
  leaveRoom(code: string, clientId: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    this.cancelDisconnectTimer(code, clientId);
    room.players = room.players.filter((p) => p.clientId !== clientId);
    return room;
  }

  /** Teacher-initiated forced removal (typically a long-disconnected student). */
  removePlayer(code: string, playerId: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    const player = room.players.find((p) => p.id === playerId);
    if (player) this.cancelDisconnectTimer(code, player.clientId);
    room.players = room.players.filter((p) => p.id !== playerId);
    return room;
  }

  markPlayerDisconnected(code: string, clientId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.clientId === clientId);
    if (!player) return;

    player.connected = false;
    this.scheduleRemoval(code, clientId, () => {
      const current = this.rooms.get(code);
      if (!current) return;
      const stillDisconnected = current.players.find(
        (p) => p.clientId === clientId && !p.connected
      );
      if (stillDisconnected) {
        current.players = current.players.filter((p) => p.clientId !== clientId);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Race lifecycle (Milestone 3: just the status/maze transition -
  // no interpreter or win detection yet, that's Milestone 4/5)
  // ---------------------------------------------------------------------

  startRace(code: string, mazeId: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    room.status = 'racing';
    room.currentMazeId = mazeId;
    return room;
  }

  resetRace(code: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    room.status = 'lobby';
    room.currentMazeId = null;
    return room;
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private failure(reason: JoinFailureReason): JoinResult {
    return { ok: false, reason };
  }

  private timerKey(code: string, clientId: string): TimerKey {
    return `${code}:${clientId}`;
  }

  private scheduleRemoval(code: string, clientId: string, onExpire: () => void): void {
    const key = this.timerKey(code, clientId);
    this.cancelDisconnectTimer(code, clientId);
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(key);
      onExpire();
    }, this.gracePeriodMs);
    this.disconnectTimers.set(key, timer);
  }

  private cancelDisconnectTimer(code: string, clientId: string): void {
    const key = this.timerKey(code, clientId);
    const timer = this.disconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(key);
    }
  }
}
