import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@racer/shared';

import { healthRouter } from './http/health.js';
import { RoomManager } from './rooms/RoomManager.js';
import { registerRoomHandlers } from './sockets/roomHandlers.js';
import { registerRaceHandlers } from './sockets/raceHandlers.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(healthRouter);

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

export const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.data.clientId = '';
  socket.data.roomCode = null;

  registerRoomHandlers(io, socket, roomManager);
  registerRaceHandlers(io, socket, roomManager);

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] accepting client origin: ${CLIENT_ORIGIN}`);
});
