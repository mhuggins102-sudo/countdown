import { useGame } from './useGame';
import type { ChallengeRoundResult } from '../types/game';

/**
 * Returns the opponent's result for the current round in challenge mode.
 * Returns null if not in challenge mode or no opponent data.
 */
export function useChallengeOpponent(): {
  hasOpponent: boolean;
  opponentName: string;
  result: ChallengeRoundResult | null;
} {
  const { state } = useGame();
  const cd = state.challengeData;

  if (state.mode !== 'challenge' || !cd?.opponentResults?.length) {
    return { hasOpponent: false, opponentName: '', result: null };
  }

  return {
    hasOpponent: true,
    opponentName: cd.opponentName || 'Challenger',
    result: cd.opponentResults[state.currentRound] || null,
  };
}
