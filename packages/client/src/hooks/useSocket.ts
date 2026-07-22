import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@racer/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

/**
 * Establishes a single typed Socket.io connection for the app's
 * lifetime. Room/race-specific hooks (added in later milestones)
 * will consume the socket instance this returns rather than each
 * opening their own connection.
 */
export function useSocket(): { socket: AppSocket; connected: boolean } {
  const socketRef = useRef<AppSocket>();
  const [connected, setConnected] = useState(false);

  if (!socketRef.current) {
    socketRef.current = io(SERVER_URL, { autoConnect: true });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}
