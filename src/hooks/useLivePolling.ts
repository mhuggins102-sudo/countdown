import { useEffect, useRef } from 'react';
import { useGame } from './useGame';
import { pollLiveRoom } from '../api/liveApi';

const POLL_INTERVAL = 2000;

/**
 * Polls the live room every 2 seconds and dispatches state updates:
 * - Opponent joined
 * - Picks ready (for P2)
 * - Opponent submitted their result
 * - Heartbeat / disconnect detection
 */
export function useLivePolling() {
  const { state, dispatch } = useGame();
  const liveData = state.liveData;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.mode !== 'live' || !liveData) return;

    const poll = async () => {
      const room = await pollLiveRoom(liveData.code, liveData.playerId);
      if (!room) return;

      // Opponent joined
      if (!liveData.opponentJoined && room.status === 'playing') {
        const oppName = liveData.isHost ? (room.p2Name || 'Player 2') : (room.p1Name || 'Player 1');
        dispatch({ type: 'LIVE_OPPONENT_JOINED', opponentName: oppName });
      }

      // Picks ready (for whichever player is NOT picking this round)
      const isMyPickRound = liveData.isHost ? (state.currentRound % 2 === 0) : (state.currentRound % 2 === 1);
      if (!isMyPickRound && !liveData.currentPicks) {
        const picks = room.picks.find((p) => p.roundIndex === state.currentRound);
        if (picks) {
          dispatch({ type: 'LIVE_PICKS_READY', picks });
        }
      }

      // Opponent submitted result for current round
      if (!liveData.opponentResult) {
        const oppResults = liveData.isHost ? room.p2Results : room.p1Results;
        const oppResult = oppResults[state.currentRound];
        if (oppResult) {
          const oppTotal = liveData.isHost ? room.p2TotalScore : room.p1TotalScore;
          dispatch({ type: 'LIVE_OPPONENT_SUBMITTED', result: oppResult, opponentTotalScore: oppTotal });
        }
      }

      // Heartbeat
      const oppLastSeen = liveData.isHost ? room.p2LastSeen : room.p1LastSeen;
      if (oppLastSeen !== liveData.opponentLastSeen) {
        dispatch({ type: 'LIVE_UPDATE_HEARTBEAT', opponentLastSeen: oppLastSeen });
      }
    };

    // Poll immediately, then every 2s
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    state.mode,
    liveData?.code,
    liveData?.playerId,
    liveData?.isHost,
    liveData?.opponentJoined,
    liveData?.currentPicks,
    liveData?.opponentResult,
    state.currentRound,
    dispatch,
  ]);
}
