import { useGame } from './useGame';
import type { ChallengeRoundResult } from '../types/game';

/**
 * Returns the opponent's result for the current round in challenge mode.
 * Returns null if not in challenge mode or no opponent data.
 */
export function useChallengeOpponent(): {
  isP1: boolean;
  hasOpponent: boolean;
  opponentName: string;
  result: ChallengeRoundResult | null;
} {
  const { state } = useGame();
  const cd = state.challengeData;
  const isChallenge = state.mode === 'challenge';

  if (!isChallenge || !cd?.opponentResults?.length) {
    return { isP1: isChallenge, hasOpponent: false, opponentName: '', result: null };
  }

  return {
    isP1: false,
    hasOpponent: true,
    opponentName: cd.opponentName || 'Challenger',
    result: cd.opponentResults[state.currentRound] || null,
  };
}
