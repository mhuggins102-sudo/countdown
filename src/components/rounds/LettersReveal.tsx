import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { isValidWord, canFormWord } from '../../engine/wordValidator';
import { findLongestWord } from '../../engine/wordFinder';
import { aiPickWord } from '../../engine/aiOpponent';
import { scoreLettersRound } from '../../engine/scoring';
import type { LettersRoundState } from '../../types/game';
import { useChallengeOpponent } from '../../hooks/useChallengeOpponent';

export function LettersReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as LettersRoundState;
  const { isP1, hasOpponent, opponentName, result: opponentResult } = useChallengeOpponent();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    // Compute AI word and best word
    const aiWord = state.difficulty !== 'off'
      ? aiPickWord(round.letters, state.difficulty)
      : '';
    const bestWord = findLongestWord(round.letters);

    // In challenge mode as P2, score head-to-head against P1's word
    const opponentWord = hasOpponent && opponentResult ? opponentResult.answer : aiWord;
    const scores = scoreLettersRound(round.playerWord, opponentWord, round.letters);

    dispatch({
      type: 'SET_ROUND_RESULTS',
      playerScore: scores.playerScore,
      aiScore: scores.aiScore,
      extras: {
        aiWord,
        bestWord,
        playerWordValid: scores.playerWordValid,
      },
    });
  }, [revealed, round, state.mode, state.difficulty, hasOpponent, opponentResult, dispatch]);

  if (!revealed || state.phase !== 'reveal') return null;

  const playerValid = round.playerWord.length > 0 && isValidWord(round.playerWord) && canFormWord(round.playerWord, round.letters);

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-blue-300">Round Results</h2>

      {/* Player result */}
      <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-blue-400 mb-1">Your word</div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">
            {round.playerWord || '(none)'}
          </span>
          <div className="flex items-center gap-2">
            {round.playerWord && (
              <span className={`text-sm ${playerValid ? 'text-green-400' : 'text-red-400'}`}>
                {playerValid ? 'Valid' : 'Invalid'}
              </span>
            )}
            <span className="text-2xl font-bold text-[#fbbf24]">{isP1 ? '+?' : `+${round.playerScore}`}</span>
          </div>
        </div>
      </div>

      {/* AI result */}
      {state.difficulty !== 'off' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI's word</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {round.aiWord || '(none)'}
            </span>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

      {/* Challenger result */}
      {hasOpponent && opponentResult && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-purple-400 mb-1">{opponentName}'s word</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {opponentResult.answer || '(none)'}
            </span>
            <span className="text-2xl font-bold text-[#fbbf24]">+{opponentResult.score}</span>
          </div>
        </div>
      )}

      {/* Best word (Dictionary Corner) */}
      <div className="bg-[#0a1628] border border-[#2a4a7f] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-[#fbbf24] mb-1">Dictionary Corner</div>
        <div className="text-2xl font-bold text-white">
          {round.bestWord || 'No words found'}
          {round.bestWord && (
            <span className="text-lg text-blue-300 ml-2">
              ({round.bestWord.length} letters)
            </span>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
      >
        {state.mode === 'freeplay' ? 'Play Again' : state.currentRound >= 14 ? 'See Final Scores' : 'Next Round'}
      </Button>
    </div>
  );
}
