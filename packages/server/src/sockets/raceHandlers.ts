import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@racer/shared';
import { getMazeById } from '@racer/shared';
import { RoomManager } from '../rooms/RoomManager.js';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerRaceHandlers(io: AppServer, socket: AppSocket, roomManager: RoomManager): void {
  socket.on('race:start', (roomCode, mazeId) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.teacherId !== socket.id) {
      socket.emit('room:error', "Only the room's teacher can start a race.");
      return;
    }

    const maze = getMazeById(mazeId);
    if (!maze) {
      socket.emit('room:error', `Unknown maze id: ${mazeId}`);
      return;
    }

    const updated = roomManager.startRace(roomCode, mazeId);
    if (!updated) return;

    io.to(roomCode).emit('race:started', maze);
    io.to(roomCode).emit('room:state', updated);
  });

  socket.on('race:reset', (roomCode) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.teacherId !== socket.id) {
      socket.emit('room:error', "Only the room's teacher can reset the race.");
      return;
    }

    const updated = roomManager.resetRace(roomCode);
    if (!updated) return;

    io.to(roomCode).emit('room:state', updated);
  });

  socket.on('race:progress', (roomCode, step) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status !== 'racing') return;

    // Relayed to everyone else in the room - the teacher dashboard
    // is the consumer. Identified by the sender's stable clientId,
    // NOT socket.id: a student's socket id changes on every
    // reconnect, but the dashboard's robot map needs one consistent
    // key per student for the whole race, or a reconnect would spawn
    // a second robot instead of updating the existing one.
    socket.to(roomCode).emit('race:opponentProgress', socket.data.clientId, step);
  });

  socket.on('race:finish', (roomCode, _clientReportedTimeMs) => {
    // The client-reported time is intentionally ignored - see the
    // doc comment on RoomManager.recordFinish for why. It's still
    // part of the event signature so a future debug/dev view could
    // compare client vs server timing if that's ever useful.
    const result = roomManager.recordFinish(roomCode, socket.id);
    if (!result) return; // not racing, unknown player, or already finished - safe no-op

    io.to(roomCode).emit('race:leaderboard', result.leaderboard);
    io.to(roomCode).emit('room:state', result.room);
  });
}
