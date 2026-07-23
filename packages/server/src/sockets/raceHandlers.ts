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

  // race:progress and race:finish are Milestone 5 (real interpreter-driven
  // execution) - deliberately unhandled here so a stray client emit is a
  // silent no-op rather than something to half-implement now.
}
