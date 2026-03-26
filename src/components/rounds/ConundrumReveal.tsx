import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { scoreConundrumRound } from '../../engine/scoring';
import type { ConundrumRoundState } from '../../types/game';
import { useChallengeOpponent } from '../../hooks/useChallengeOpponent';

export function ConundrumReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as ConundrumRoundState;
  const [revealed, setRevealed] = useState(false);
  const { isP1, hasOpponent, opponentName, result: opponentResult } = useChallengeOpponent();

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    let playerScore = 0;
    let aiScore = 0;

    if (hasOpponent && opponentResult) {
      // P2 challenge: head-to-head conundrum scoring
      const playerCorrect = round.playerGuess.toUpperCase() === round.answer.toUpperCase();
      const oppCorrect = opponentResult.answer.toUpperCase() === round.answer.toUpperCase();

      if (playerCorrect && oppCorrect) {
        // Both correct: compare time remaining (higher = faster)
        const oppTimeRemaining = opponentResult.timeRemaining ?? 0;
        if (round.playerTimeRemaining > oppTimeRemaining) {
          playerScore = 10;
        } else if (oppTimeRemaining > round.playerTimeRemaining) {
          aiScore = 10;
        } else {
          // Same time: both score
          playerScore = 10;
          aiScore = 10;
        }
      } else if (playerCorrect) {
        playerScore = 10;
      } else if (oppCorrect) {
        aiScore = 10;
      }
    } else {
      // AI or P1 scoring
      const playerElapsed = state.timerDuration - round.playerTimeRemaining;
      const playerSubmittedFirst = round.playerGuess.length > 0 && (!round.aiSolved || playerElapsed < round.aiGuessTime);
      const scores = scoreConundrumRound(round.playerGuess, round.aiSolved, round.answer, playerSubmittedFirst);
      playerScore = scores.playerScore;
      aiScore = scores.aiScore;
    }

    dispatch({
      type: 'SET_ROUND_RESULTS',
      playerScore,
      aiScore,
      extras: { aiSolved: round.aiSolved, aiGuessTime: round.aiGuessTime },
    });
  }, [revealed, round, state.timerDuration, hasOpponent, opponentResult, dispatch]);

  if (!revealed || state.phase !== 'reveal') return null;

  const playerCorrect = round.playerGuess.toUpperCase() === round.answer.toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* The answer */}
      <div className="bg-[#0a1628] border-2 border-[#fbbf24] rounded-xl px-8 py-4">
        <div className="text-sm text-[#fbbf24] mb-1">The answer</div>
        <div className="text-4xl font-bold text-white tracking-wider">{round.answer.toUpperCase()}</div>
      </div>

      {/* Player result */}
      <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-blue-400 mb-1">Your guess</div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">
            {round.playerGuess || '(no guess)'}
          </span>
          <div className="flex items-center gap-2">
            {round.playerGuess && (
              <span className={`text-sm ${playerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {playerCorrect ? 'Correct!' : 'Wrong'}
              </span>
            )}
            <span className="text-2xl font-bold text-[#fbbf24]">{isP1 ? '+?' : `+${round.playerScore}`}</span>
          </div>
        </div>
      </div>

      {/* AI result */}
      {state.difficulty !== 'off' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-white">
                {round.aiSolved ? round.answer.toUpperCase() : "Didn't buzz in"}
              </span>
              {round.aiSolved && (
                <div className="text-xs text-blue-400 mt-1">
                  Buzzed in at {Math.round(round.aiGuessTime)}s
                </div>
              )}
            </div>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

      {/* Challenger result */}
      {hasOpponent && opponentResult && (() => {
        const oppCorrect = opponentResult.answer.toUpperCase() === round.answer.toUpperCase();
        return (
          <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
            <div className="text-sm text-purple-400 mb-1">{opponentName}'s guess</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {opponentResult.answer || '(no guess)'}
              </span>
              <div className="flex items-center gap-2">
                {opponentResult.answer && (
                  <span className={`text-sm ${oppCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {oppCorrect ? 'Correct!' : 'Wrong'}
                  </span>
                )}
                <span className="text-2xl font-bold text-[#fbbf24]">+{opponentResult.score}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <Button
        variant="primary"
        size="lg"
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
      >
        {state.mode === 'freeplay' ? 'Play Again' : 'See Final Scores'}
      </Button>
    </div>
  );
}
