import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { aiSolveConundrum } from '../../engine/aiOpponent';
import { scoreConundrumRound } from '../../engine/scoring';
import type { ConundrumRoundState } from '../../types/game';

export function ConundrumReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as ConundrumRoundState;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    let aiSolved = false;
    if (state.mode === 'fullgame') {
      const aiResult = aiSolveConundrum(state.difficulty);
      aiSolved = aiResult.solved;
    }

    const playerCorrect = round.playerGuess.toUpperCase() === round.answer.toUpperCase();
    const playerSubmittedFirst = round.playerGuess.length > 0;

    const scores = scoreConundrumRound(
      round.playerGuess,
      aiSolved,
      round.answer,
      playerSubmittedFirst,
    );

    dispatch({
      type: 'SET_ROUND_RESULTS',
      playerScore: scores.playerScore,
      aiScore: scores.aiScore,
      extras: { aiSolved },
    });
  }, [revealed, round, state.mode, state.difficulty, dispatch]);

  if (!revealed || state.phase !== 'reveal') return null;

  const playerCorrect = round.playerGuess.toUpperCase() === round.answer.toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-[#fbbf24]">CONUNDRUM - Results</h2>

      {/* The answer */}
      <div className="bg-[#0a1628] border-2 border-[#fbbf24] rounded-xl px-8 py-4">
        <div className="text-sm text-[#fbbf24] mb-1">The answer</div>
        <div className="text-4xl font-bold text-white tracking-wider">{round.answer}</div>
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
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.playerScore}</span>
          </div>
        </div>
      </div>

      {/* AI result */}
      {state.mode === 'fullgame' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {round.aiSolved ? round.answer : '(did not solve)'}
            </span>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

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
