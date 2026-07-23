import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@racer/shared';
import type { AppSocket } from '../../hooks/useSocket.js';

export function useLeaderboard(socket: AppSocket, mazeId: string): LeaderboardEntry[] {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // A new race (different maze id, including the transition into/out
  // of practice mode) starts with an empty board - stale entries from
  // a previous race shouldn't linger.
  useEffect(() => {
    setLeaderboard([]);
  }, [mazeId]);

  useEffect(() => {
    const onLeaderboard = (entries: LeaderboardEntry[]) => setLeaderboard(entries);
    socket.on('race:leaderboard', onLeaderboard);
    return () => {
      socket.off('race:leaderboard', onLeaderboard);
    };
  }, [socket]);

  return leaderboard;
}
