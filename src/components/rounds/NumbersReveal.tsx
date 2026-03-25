import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { SolutionSteps } from './SolutionSteps';
import { solveNumbers } from '../../engine/numbersSolver';
import { aiPickNumber } from '../../engine/aiOpponent';
import { scoreNumbersRound } from '../../engine/scoring';
import type { NumbersRoundState } from '../../types/game';

export function NumbersReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    const { steps } = solveNumbers(round.numbers, round.target);
    const aiAnswer = state.mode === 'fullgame'
      ? aiPickNumber(round.numbers, round.target, state.difficulty)
      : null;
    const scores = scoreNumbersRound(round.playerAnswer, aiAnswer, round.target);

    dispatch({
      type: 'SET_ROUND_RESULTS',
      playerScore: scores.playerScore,
      aiScore: scores.aiScore,
      extras: {
        aiAnswer,
        solution: steps,
      },
    });
  }, [revealed, round, state.mode, state.difficulty, dispatch]);

  if (!revealed || state.phase !== 'reveal') return null;

  const playerDist = round.playerAnswer !== null ? Math.abs(round.playerAnswer - round.target) : null;
  const aiDist = round.aiAnswer !== null ? Math.abs(round.aiAnswer - round.target) : null;

  // Find closest achievable for solution display
  const lastStep = round.solution.length > 0 ? round.solution[round.solution.length - 1] : null;
  const closest = lastStep ? lastStep.result : round.numbers[0] || 0;

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-blue-300">Round Results</h2>

      {/* Target reminder */}
      <div className="text-3xl font-bold text-[#fbbf24] tabular-nums">
        Target: {round.target}
      </div>

      {/* Player result */}
      <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-blue-400 mb-1">Your answer</div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-white tabular-nums">
              {round.playerAnswer ?? '(none)'}
            </span>
            {playerDist !== null && (
              <span className="text-sm text-blue-300 ml-2">
                ({playerDist === 0 ? 'exact!' : `off by ${playerDist}`})
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-[#fbbf24]">+{round.playerScore}</span>
        </div>
      </div>

      {/* AI result */}
      {state.mode === 'fullgame' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI's answer</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">
                {round.aiAnswer ?? '(none)'}
              </span>
              {aiDist !== null && (
                <span className="text-sm text-blue-300 ml-2">
                  ({aiDist === 0 ? 'exact!' : `off by ${aiDist}`})
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

      {/* Solution steps */}
      <SolutionSteps steps={round.solution} target={round.target} closest={closest} />

      <Button
        variant="primary"
        size="lg"
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
      >
        {state.mode === 'freeplay' ? 'Play Again' : 'Next Round'}
      </Button>
    </div>
  );
}
