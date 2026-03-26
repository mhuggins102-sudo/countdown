import { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { SolutionSteps } from './SolutionSteps';
import { solveNumbers } from '../../engine/numbersSolver';
import { aiPickNumber } from '../../engine/aiOpponent';
import { scoreNumbersRound } from '../../engine/scoring';
import { displayOp, getOriginalHighlights } from '../../engine/expressionEval';
import type { NumbersRoundState, SolutionStep } from '../../types/game';
import { useChallengeOpponent } from '../../hooks/useChallengeOpponent';

export function NumbersReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [revealed, setRevealed] = useState(false);
  const { isP1, hasOpponent, opponentName, result: opponentResult } = useChallengeOpponent();

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    const { steps } = solveNumbers(round.numbers, round.target);
    const aiResult = state.difficulty !== 'off'
      ? aiPickNumber(round.numbers, round.target, state.difficulty)
      : null;
    const aiAnswer = aiResult?.answer ?? null;
    const scores = scoreNumbersRound(round.playerAnswer, aiAnswer, round.target);

    dispatch({
      type: 'SET_ROUND_RESULTS',
      playerScore: scores.playerScore,
      aiScore: scores.aiScore,
      extras: {
        aiAnswer,
        aiSteps: aiResult?.steps ?? [],
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
          <span className="text-2xl font-bold text-[#fbbf24]">{isP1 ? '+?' : `+${round.playerScore}`}</span>
        </div>
        {/* Show player's working */}
        {round.playerSteps.length > 0 && (
          <StepsWithHighlights steps={round.playerSteps} originalNumbers={round.numbers} target={round.target} />
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
          {round.aiSteps.length > 0 && (
            <StepsWithHighlights steps={round.aiSteps} originalNumbers={round.numbers} target={round.target} />
          )}
        </div>
      )}

      {/* Challenger result */}
      {hasOpponent && opponentResult && (() => {
        const oppAnswer = opponentResult.answer ? Number(opponentResult.answer) : null;
        const oppDist = oppAnswer !== null && !isNaN(oppAnswer) ? Math.abs(oppAnswer - round.target) : null;
        return (
          <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
            <div className="text-sm text-purple-400 mb-1">{opponentName}'s answer</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {oppAnswer ?? '(none)'}
                </span>
                {oppDist !== null && (
                  <span className="text-sm text-blue-300 ml-2">
                    ({formatDist(oppAnswer!)})
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold text-[#fbbf24]">+{opponentResult.score}</span>
            </div>
            {opponentResult.steps && opponentResult.steps.length > 0 && (
              <StepsWithHighlights steps={opponentResult.steps as SolutionStep[]} originalNumbers={round.numbers} target={round.target} />
            )}
          </div>
        );
      })()}

      {/* Optimal solution steps — hide if player or AI already got exact */}
      {playerDist !== 0 && aiDist !== 0 && (
        <SolutionSteps steps={round.solution} target={round.target} closest={closest} originalNumbers={round.numbers} />
      )}

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

function StepsWithHighlights({ steps, originalNumbers, target }: { steps: SolutionStep[]; originalNumbers: number[]; target: number }) {
  const highlights = getOriginalHighlights(steps, originalNumbers);
  return (
    <div className="mt-2 pt-2 border-t border-[#2a4a7f]/50 font-mono text-sm space-y-1">
      {steps.map((step, i) => {
        const hl = highlights[i];
        return (
          <div key={i} className="flex items-center gap-1.5">
            <span className={hl.aIsOriginal ? 'bg-[#fbbf24]/20 text-[#fbbf24] px-1 rounded font-bold' : 'text-blue-200'}>
              {step.a}
            </span>
            <span className="text-[#fbbf24]">{displayOp(step.op)}</span>
            <span className={hl.bIsOriginal ? 'bg-[#fbbf24]/20 text-[#fbbf24] px-1 rounded font-bold' : 'text-blue-200'}>
              {step.b}
            </span>
            <span className="text-blue-400">=</span>
            <span className={`font-bold ${step.result === target ? 'text-green-400' : 'text-white'}`}>
              {step.result}
            </span>
          </div>
        );
      })}
    </div>
  );
}
