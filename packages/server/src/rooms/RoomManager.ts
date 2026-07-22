import type { Room } from '@racer/shared';

/**
 * In-memory room store. Deliberately a plain class over a Map rather
 * than a DB from day one — rooms are ephemeral (a class period), so
 * this is the right amount of persistence for V1. Swapping this for
 * a Postgres-backed implementation later only touches this file,
 * since callers only ever see the public methods below.
 *
 * Full create/join/leave logic is implemented in Milestone 2. This
 * stub exists now so server/src/index.ts has something real to wire
 * up and typecheck against in Milestone 1.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  count(): number {
    return this.rooms.size;
  }
}
