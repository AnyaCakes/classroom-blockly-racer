import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@racer/shared';
import { RoomManager } from '../rooms/RoomManager.js';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerRoomHandlers(io: AppServer, socket: AppSocket, roomManager: RoomManager): void {
  socket.on('room:create', (clientId, cb) => {
    const room = roomManager.createRoom(socket.id, clientId);
    socket.data.clientId = clientId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    cb({ roomCode: room.code, room });
  });

  socket.on('room:rejoinTeacher', (roomCode, clientId, cb) => {
    const room = roomManager.reconnectTeacher(roomCode, clientId, socket.id);
    if (!room) {
      cb({ ok: false, reason: 'not_teacher_of_room' });
      return;
    }
    socket.data.clientId = clientId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);
    cb({ ok: true, room });
    io.to(roomCode).emit('room:state', room);
  });

  socket.on('room:join', (roomCode, nickname, color, clientId, cb) => {
    const result = roomManager.joinRoom(roomCode, socket.id, clientId, nickname, color);
    cb(result);
    if (!result.ok) return;

    socket.data.clientId = clientId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);

    io.to(roomCode).emit('room:playerJoined', result.player);
    io.to(roomCode).emit('room:state', result.room);
  });

  socket.on('room:leave', (roomCode) => {
    const clientId = socket.data.clientId;
    if (!clientId) return;

    const room = roomManager.leaveRoom(roomCode, clientId);
    socket.leave(roomCode);
    socket.data.roomCode = null;
    if (!room) return;

    io.to(roomCode).emit('room:playerLeft', socket.id);
    io.to(roomCode).emit('room:state', room);
  });

  socket.on('room:removePlayer', (roomCode, playerId) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.teacherId !== socket.id) {
      socket.emit('room:error', "Only the room's teacher can remove a student.");
      return;
    }

    const updated = roomManager.removePlayer(roomCode, playerId);
    if (!updated) return;

    // Broadcast BEFORE the removed socket leaves the room channel -
    // io.to(roomCode) only reaches sockets currently in that room,
    // so this order is what actually gets the removed student their
    // own room:playerLeft event (which useRoom.ts uses to reset
    // their local room/role state back to the role-select screen).
    // Broadcasting after they'd already left meant they silently
    // never received it and stayed stuck on whatever screen they
    // were on, with only a room:error toast that doesn't reset
    // anything.
    io.to(roomCode).emit('room:playerLeft', playerId);

    const removedSocket = io.sockets.sockets.get(playerId);
    if (removedSocket) {
      removedSocket.leave(roomCode);
      removedSocket.data.roomCode = null;
      removedSocket.emit('room:error', 'You were removed from the room by the teacher.');
    }

    io.to(roomCode).emit('room:state', updated);
  });

  socket.on('disconnect', () => {
    const { clientId, roomCode } = socket.data;
    if (!clientId || !roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.teacherId === socket.id) {
      roomManager.markTeacherDisconnected(roomCode);
    } else {
      roomManager.markPlayerDisconnected(roomCode, clientId);
    }

    // Reflect the disconnected state immediately; the grace-period
    // timer inside RoomManager decides later whether it becomes a
    // permanent removal (see markPlayerDisconnected / markTeacherDisconnected).
    const current = roomManager.getRoom(roomCode);
    if (current) io.to(roomCode).emit('room:state', current);
  });
}
