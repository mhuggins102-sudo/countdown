import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { SolutionSteps } from './SolutionSteps';
import { solveNumbers } from '../../engine/numbersSolver';
import { aiPickNumber } from '../../engine/aiOpponent';
import { scoreNumbersRound } from '../../engine/scoring';
import { displayOp } from '../../engine/expressionEval';
import type { NumbersRoundState, SolutionStep } from '../../types/game';

export function NumbersReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    const { steps } = solveNumbers(round.numbers, round.target);
    const aiAnswer = state.difficulty !== 'off'
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

  const playerDist = round.playerAnswer !== null && round.playerAnswer !== -9999
    ? Math.abs(round.playerAnswer - round.target) : null;
  const aiDist = round.aiAnswer !== null ? Math.abs(round.aiAnswer - round.target) : null;

  // Find closest achievable for solution display
  const lastStep = round.solution.length > 0 ? round.solution[round.solution.length - 1] : null;
  const closest = lastStep ? lastStep.result : round.numbers[0] || 0;

  const formatDist = (answer: number) => {
    const diff = answer - round.target;
    if (diff === 0) return 'exact!';
    const absDiff = Math.abs(diff);
    const direction = diff > 0 ? 'above' : 'below';
    return <>{absDiff} {direction} <span className="text-[#fbbf24]">{round.target}</span></>;
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-blue-300">Round Results</h2>

      {/* Player result */}
      <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-blue-400 mb-1">Your answer</div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-white tabular-nums">
              {playerDist !== null ? round.playerAnswer : '(none)'}
            </span>
            {playerDist !== null && (
              <span className="text-sm text-blue-300 ml-2">
                ({formatDist(round.playerAnswer!)})
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-[#fbbf24]">+{round.playerScore}</span>
        </div>
        {/* Show player's working */}
        {round.playerSteps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#2a4a7f]/50 font-mono text-sm space-y-1">
            {round.playerSteps.map((step: SolutionStep, i: number) => (
              <div key={i} className="text-blue-200">
                {step.a} {displayOp(step.op)} {step.b} = {step.result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI result */}
      {state.difficulty !== 'off' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI's answer</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">
                {round.aiAnswer ?? '(none)'}
              </span>
              {aiDist !== null && (
                <span className="text-sm text-blue-300 ml-2">
                  ({formatDist(round.aiAnswer!)})
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

      {/* Optimal solution steps */}
      <SolutionSteps steps={round.solution} target={round.target} closest={closest} originalNumbers={round.numbers} />

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
