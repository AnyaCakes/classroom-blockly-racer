import { useCallback, useEffect, useState } from 'react';
import type { JoinFailureReason, RoomSnapshot } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';
import { getOrCreateClientId } from './useClientId.js';

export type LobbyRole = 'teacher' | 'student' | null;

interface UseRoomResult {
  room: RoomSnapshot | null;
  role: LobbyRole;
  error: string | null;
  isTeacherOfRoom: boolean;
  createRoom: () => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  removePlayer: (playerId: string) => void;
  clearError: () => void;
}

export function useRoom(socket: AppSocket, connected: boolean): UseRoomResult {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [role, setRole] = useState<LobbyRole>(null);
  const [error, setError] = useState<string | null>(null);
  const clientId = getOrCreateClientId();

  // Live roster updates, and the source of truth for room state.
  useEffect(() => {
    const onState = (nextRoom: RoomSnapshot) => setRoom(nextRoom);
    const onError = (message: string) => setError(message);
    const onPlayerLeft = (playerId: string) => {
      // If we're the one who was removed (teacher-initiated), our
      // socket has already left the room's channel server-side and
      // won't get further room:state updates - reset locally too.
      if (playerId === socket.id) {
        setRoom(null);
        setRole(null);
      }
    };

    socket.on('room:state', onState);
    socket.on('room:error', onError);
    socket.on('room:playerLeft', onPlayerLeft);

    return () => {
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      socket.off('room:playerLeft', onPlayerLeft);
    };
  }, [socket]);

  // If we already have a room in localStorage-equivalent (sessionStorage
  // clientId) and the socket reconnects, try to silently rejoin as
  // teacher. Students rejoin implicitly the next time they submit the
  // join form with the same clientId - RoomManager treats that as a
  // reconnect rather than a fresh join.
  useEffect(() => {
    if (!connected || !room || role !== 'teacher') return;
    socket.emit('room:rejoinTeacher', room.code, clientId, (result) => {
      if (result.ok) {
        setRoom(result.room);
      }
    });
    // Only re-run when the connection itself changes, not on every room update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const createRoom = useCallback(() => {
    socket.emit('room:create', clientId, ({ room: created }) => {
      setRole('teacher');
      setRoom(created);
      setError(null);
    });
  }, [socket, clientId]);

  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      socket.emit('room:join', roomCode.trim().toUpperCase(), nickname, clientId, (result) => {
        if (result.ok) {
          setRole('student');
          setRoom(result.room);
          setError(null);
        } else {
          setError(describeJoinFailure(result.reason));
        }
      });
    },
    [socket, clientId]
  );

  const leaveRoom = useCallback(() => {
    if (!room) return;
    socket.emit('room:leave', room.code);
    setRoom(null);
    setRole(null);
  }, [socket, room]);

  const removePlayer = useCallback(
    (playerId: string) => {
      if (!room) return;
      socket.emit('room:removePlayer', room.code, playerId);
    },
    [socket, room]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    room,
    role,
    error,
    isTeacherOfRoom: role === 'teacher',
    createRoom,
    joinRoom,
    leaveRoom,
    removePlayer,
    clearError,
  };
}

function describeJoinFailure(reason: JoinFailureReason): string {
  switch (reason) {
    case 'room_not_found':
      return "We couldn't find a room with that code. Double-check it and try again.";
    case 'room_in_progress':
      return 'That race has already started - ask your teacher for the next room code.';
    case 'room_abandoned':
      return 'This room is no longer active.';
    case 'nickname_taken':
      return 'Someone in the room already has that nickname - try another.';
    case 'nickname_invalid':
      return 'Nicknames need to be between 1 and 20 characters.';
    default:
      return 'Something went wrong joining the room.';
  }
}
