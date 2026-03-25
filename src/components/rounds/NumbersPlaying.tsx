import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState, SolutionStep } from '../../types/game';

type Op = '+' | '-' | '*' | '/';

function applyOp(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b > 0 ? a - b : null;
    case '*': return a * b;
    case '/': return b !== 0 && a % b === 0 ? a / b : null;
  }
}

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [submitted, setSubmitted] = useState(false);

  // available[i] = null means it's been used in a step
  const [available, setAvailable] = useState<(number | null)[]>(() => [...round.numbers]);
  const [steps, setSteps] = useState<SolutionStep[]>([]);

  // Current expression builder state
  const [selectedFirst, setSelectedFirst] = useState<number | null>(null); // index into available
  const [selectedOp, setSelectedOp] = useState<Op | null>(null);

  // The current best answer is the last step's result, or if no steps, no answer
  const currentAnswer: number | null = steps.length > 0
    ? steps[steps.length - 1].result
    : null;

  const handleSubmit = useCallback(() => {
    if (!submitted) {
      setSubmitted(true);
      dispatch({
        type: 'SUBMIT_NUMBERS_ANSWER',
        answer: currentAnswer ?? -9999,
        steps,
      });
    }
  }, [submitted, currentAnswer, steps, dispatch]);

  // When submitted, wait briefly then transition to reveal
  useEffect(() => {
    if (submitted && state.phase === 'playing') {
      const timer = setTimeout(() => {
        dispatch({ type: 'TIMER_EXPIRED' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, state.phase, dispatch]);

  useTimer(() => {
    if (!submitted) {
      setSubmitted(true);
      dispatch({
        type: 'SUBMIT_NUMBERS_ANSWER',
        answer: currentAnswer ?? -9999,
        steps,
      });
    }
  });

  const handleNumberClick = (index: number) => {
    if (submitted || available[index] === null) return;

    if (selectedFirst === null) {
      // Select first operand
      setSelectedFirst(index);
      setSelectedOp(null);
    } else if (selectedOp === null) {
      // Clicking another number without an op — switch selection
      if (index === selectedFirst) {
        setSelectedFirst(null); // deselect
      } else {
        setSelectedFirst(index);
      }
    } else {
      // We have first + op, now applying second
      if (index === selectedFirst) return; // can't use same tile

      const a = available[selectedFirst]!;
      const b = available[index]!;
      const result = applyOp(a, selectedOp, b);

      if (result === null) {
        // Invalid operation — flash or ignore
        setSelectedOp(null);
        return;
      }

      // Record step
      const newStep: SolutionStep = { a, op: selectedOp, b, result };
      setSteps([...steps, newStep]);

      // Update available: remove both operands, add result
      const newAvailable = [...available];
      newAvailable[selectedFirst] = null;
      newAvailable[index] = null;
      newAvailable.push(result);
      setAvailable(newAvailable);

      // Reset selection
      setSelectedFirst(null);
      setSelectedOp(null);
    }
  };

  const handleOpClick = (op: Op) => {
    if (submitted || selectedFirst === null) return;
    setSelectedOp(op);
  };

  const handleUndo = () => {
    if (submitted || steps.length === 0) return;
    const lastStep = steps[steps.length - 1];

    // Remove the result (last element of available)
    const newAvailable = [...available];
    newAvailable.pop();

    // Restore the two operands
    // Find the null slots that were most recently nulled
    // We need to find where a and b were. Since we always null them in order
    // and push result to end, we can reverse: find last two nulls
    const nullIndices: number[] = [];
    for (let i = newAvailable.length - 1; i >= 0; i--) {
      if (newAvailable[i] === null) {
        nullIndices.push(i);
        if (nullIndices.length === 2) break;
      }
    }

    // Restore them (the second null found was the first operand)
    if (nullIndices.length === 2) {
      newAvailable[nullIndices[1]] = lastStep.a;
      newAvailable[nullIndices[0]] = lastStep.b;
    }

    setAvailable(newAvailable);
    setSteps(steps.slice(0, -1));
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const handleClear = () => {
    if (submitted) return;
    setAvailable([...round.numbers]);
    setSteps([]);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const activeNumbers = available
    .map((n, i) => ({ value: n, index: i }))
    .filter((x) => x.value !== null);

  const ops: Op[] = ['+', '-', '*', '/'];

  // Distance from target
  const distance = currentAnswer !== null ? Math.abs(currentAnswer - round.target) : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} />

      {/* Target */}
      <div className="bg-[#1a2d50] rounded-xl px-8 py-3">
        <div className="text-sm text-blue-400 mb-1">Target</div>
        <div className="text-5xl font-bold text-[#fbbf24] tabular-nums">{round.target}</div>
      </div>

      {/* Available number tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {activeNumbers.map(({ value, index }) => (
          <button
            key={index}
            onClick={() => handleNumberClick(index)}
            disabled={submitted}
            className={`
              w-16 h-16 rounded-lg font-bold text-2xl flex items-center justify-center
              border-2 shadow-lg transition-all duration-150 cursor-pointer active:scale-95
              ${selectedFirst === index
                ? 'bg-[#fbbf24] text-[#0a1628] border-[#fbbf24] scale-105'
                : index >= round.numbers.length
                  ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white border-[#22c55e]/60'
                  : value! >= 25
                    ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628] border-[#fbbf24]/60 hover:border-[#fbbf24]'
                    : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-[#3b82f6]/40 hover:border-[#3b82f6]'
              }
              ${submitted ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Operator buttons */}
      {!submitted && (
        <div className="flex gap-3">
          {ops.map((op) => (
            <button
              key={op}
              onClick={() => handleOpClick(op)}
              disabled={selectedFirst === null}
              className={`
                w-14 h-14 rounded-full font-bold text-2xl flex items-center justify-center
                transition-all duration-150 active:scale-95
                ${selectedOp === op
                  ? 'bg-[#fbbf24] text-[#0a1628] scale-110'
                  : selectedFirst !== null
                    ? 'bg-[#2a4a7f] text-white hover:bg-[#3b82f6] cursor-pointer'
                    : 'bg-[#1a2d50] text-blue-400/30 cursor-not-allowed'
                }
              `}
            >
              {op === '*' ? '\u00d7' : op === '/' ? '\u00f7' : op}
            </button>
          ))}
        </div>
      )}

      {/* Steps taken so far */}
      {steps.length > 0 && (
        <div className="bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-xl p-3 w-full max-w-sm">
          <div className="text-xs text-blue-400 mb-2">Your working</div>
          <div className="space-y-1 font-mono text-sm">
            {steps.map((step, i) => (
              <div key={i} className="text-white">
                <span className="text-blue-300">{step.a}</span>
                {' '}
                <span className="text-[#fbbf24]">
                  {step.op === '*' ? '\u00d7' : step.op === '/' ? '\u00f7' : step.op}
                </span>
                {' '}
                <span className="text-blue-300">{step.b}</span>
                {' '}
                <span className="text-blue-400">=</span>
                {' '}
                <span className={`font-bold ${step.result === round.target ? 'text-green-400' : 'text-white'}`}>
                  {step.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current answer display */}
      {currentAnswer !== null && (
        <div className={`text-center ${distance === 0 ? 'text-green-400' : 'text-blue-300'}`}>
          <span className="text-sm">Current result: </span>
          <span className="text-xl font-bold text-white">{currentAnswer}</span>
          {distance !== null && distance > 0 && (
            <span className="text-sm ml-2">(off by {distance})</span>
          )}
          {distance === 0 && (
            <span className="text-sm ml-2 text-green-400">Exact!</span>
          )}
        </div>
      )}

      {/* Hint text */}
      {!submitted && selectedFirst === null && steps.length === 0 && (
        <p className="text-blue-400/50 text-sm">
          Tap a number, then an operator, then another number
        </p>
      )}
      {!submitted && selectedFirst !== null && selectedOp === null && (
        <p className="text-blue-400/50 text-sm">
          Now pick an operator
        </p>
      )}
      {!submitted && selectedFirst !== null && selectedOp !== null && (
        <p className="text-blue-400/50 text-sm">
          Now tap the second number
        </p>
      )}

      {/* Action buttons */}
      {!submitted && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={steps.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            disabled={steps.length === 0}
          >
            Undo
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleSubmit}
            disabled={currentAnswer === null}
          >
            Submit
          </Button>
        </div>
      )}

      {submitted && (
        <p className="text-blue-300 animate-fade-in">
          Submitted: <span className="font-bold text-white">{currentAnswer ?? 'no answer'}</span>
        </p>
      )}
    </div>
  );
}
