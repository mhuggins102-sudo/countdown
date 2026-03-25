import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState, SolutionStep } from '../../types/game';
import { displayOp } from '../../engine/expressionEval';

type Op = '+' | '-' | '*' | '/';

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [submitted, setSubmitted] = useState(false);

  // Available tiles: original 6 numbers plus any computed results; null means used up
  const [available, setAvailable] = useState<(number | null)[]>(() => [...round.numbers]);
  // Steps taken so far
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  // Current selection state
  const [selectedFirst, setSelectedFirst] = useState<number | null>(null); // index into available
  const [selectedOp, setSelectedOp] = useState<Op | null>(null);

  // The player's current answer is the last result, or a single selected number
  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const currentAnswer = lastStep ? lastStep.result : null;
  const distance = currentAnswer !== null ? Math.abs(currentAnswer - round.target) : null;

  const handleSubmit = useCallback(() => {
    if (!submitted) {
      setSubmitted(true);
      if (currentAnswer !== null) {
        dispatch({
          type: 'SUBMIT_NUMBERS_ANSWER',
          answer: currentAnswer,
          steps,
        });
      } else {
        dispatch({
          type: 'SUBMIT_NUMBERS_ANSWER',
          answer: -9999,
          steps: [],
        });
      }
    }
  }, [submitted, currentAnswer, steps, dispatch]);

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
      if (currentAnswer !== null) {
        dispatch({
          type: 'SUBMIT_NUMBERS_ANSWER',
          answer: currentAnswer,
          steps,
        });
      } else {
        dispatch({
          type: 'SUBMIT_NUMBERS_ANSWER',
          answer: -9999,
          steps: [],
        });
      }
    }
  });

  // Tap a number tile
  const handleNumberTap = (index: number) => {
    if (submitted || available[index] === null) return;

    if (selectedFirst === null) {
      // Select first operand
      setSelectedFirst(index);
    } else if (selectedOp === null) {
      // No operator yet — deselect and select this one instead
      if (index === selectedFirst) {
        setSelectedFirst(null);
      } else {
        setSelectedFirst(index);
      }
    } else {
      // We have first + op, now apply with second
      if (index === selectedFirst) return; // can't use same tile twice
      const a = available[selectedFirst]!;
      const b = available[index]!;
      const result = applyOp(a, selectedOp, b);
      if (result === null) {
        // Invalid operation — reset selection
        setSelectedFirst(null);
        setSelectedOp(null);
        return;
      }
      // Record step
      const step: SolutionStep = { a, op: selectedOp, b, result };
      setSteps([...steps, step]);
      // Remove used tiles, add result as new tile
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

  // Tap an operator
  const handleOpTap = (op: Op) => {
    if (submitted) return;
    if (selectedFirst === null) return; // need a number first
    setSelectedOp(op);
  };

  // Undo last step
  const handleUndo = () => {
    if (submitted || steps.length === 0) return;
    const lastStep = steps[steps.length - 1];
    const newSteps = steps.slice(0, -1);
    setSteps(newSteps);
    // Remove the result tile (last element) and restore the two operands
    const newAvailable = available.slice(0, -1); // remove last (the result)
    // Find the null slots where a and b were and restore them
    // We need to find which slots were nulled — they're the ones that had a and b
    // Since we always null them in order and push result at end, we can track by finding nulls
    // Actually, let's just rebuild: find two null slots and restore them
    let restoredA = false;
    let restoredB = false;
    for (let i = 0; i < newAvailable.length; i++) {
      if (newAvailable[i] === null && !restoredA) {
        // Check if this could be the a value
        // We need to restore in the right spots — use a smarter approach
        // Since operations consume two tiles and produce one, undoing removes the produced
        // and restores the two consumed. We stored the values so just find null slots.
        newAvailable[i] = lastStep.a;
        restoredA = true;
      } else if (newAvailable[i] === null && restoredA && !restoredB) {
        newAvailable[i] = lastStep.b;
        restoredB = true;
      }
    }
    setAvailable(newAvailable);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  // Clear all — reset to original numbers
  const handleClear = () => {
    if (submitted) return;
    setAvailable([...round.numbers]);
    setSteps([]);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const ops: Op[] = ['+', '-', '*', '/'];

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
        {available.map((num, i) => {
          if (num === null) {
            return (
              <div
                key={i}
                className="w-16 h-16 rounded-lg bg-[#1a2d50]/30 border-2 border-[#2a4a7f]/20"
              />
            );
          }
          const isOriginal = i < round.numbers.length;
          const isResult = !isOriginal;
          const isSelected = selectedFirst === i;
          const isLarge = isOriginal && num >= 25;
          return (
            <button
              key={i}
              onClick={() => handleNumberTap(i)}
              disabled={submitted}
              className={`
                w-16 h-16 rounded-lg font-bold text-2xl flex items-center justify-center
                border-2 shadow-lg transition-all duration-200
                ${isSelected
                  ? 'ring-4 ring-[#fbbf24] border-[#fbbf24] scale-105'
                  : ''
                }
                ${isResult
                  ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white border-[#22c55e]/60 hover:border-[#22c55e] cursor-pointer active:scale-95'
                  : isLarge
                    ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628] border-[#fbbf24]/60 hover:border-[#fbbf24] cursor-pointer active:scale-95'
                    : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-[#3b82f6]/40 hover:border-[#3b82f6] cursor-pointer active:scale-95'
                }
                ${submitted ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Current selection indicator */}
      {!submitted && (selectedFirst !== null || selectedOp !== null) && (
        <div className="flex items-center gap-2 text-lg text-white bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-lg px-4 py-2">
          {selectedFirst !== null && available[selectedFirst] !== null && (
            <span className="font-bold text-[#fbbf24]">{available[selectedFirst]}</span>
          )}
          {selectedOp && (
            <span className="font-bold text-white">{displayOp(selectedOp)}</span>
          )}
          <span className="text-blue-400/50 text-sm">
            {selectedFirst !== null && !selectedOp ? '← pick operator' : selectedOp ? '← pick second number' : ''}
          </span>
        </div>
      )}

      {/* Operators */}
      {!submitted && (
        <div className="flex gap-2 items-center">
          {ops.map((op) => (
            <button
              key={op}
              onClick={() => handleOpTap(op)}
              disabled={selectedFirst === null}
              className={`
                w-12 h-12 rounded-full font-bold text-xl flex items-center justify-center
                transition-all
                ${selectedOp === op
                  ? 'bg-[#fbbf24] text-[#0a1628] ring-2 ring-white scale-110'
                  : selectedFirst !== null
                    ? 'bg-[#2a4a7f] text-white hover:bg-[#3b82f6] cursor-pointer active:scale-95'
                    : 'bg-[#1a2d50] text-[#2a4a7f] cursor-not-allowed'
                }
              `}
            >
              {displayOp(op)}
            </button>
          ))}
        </div>
      )}

      {/* Steps taken */}
      {steps.length > 0 && (
        <div className="bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-xl p-3 w-full max-w-md">
          <div className="text-xs text-blue-400 mb-1">Your working</div>
          <div className="space-y-1 font-mono text-sm">
            {steps.map((step, i) => (
              <div key={i} className="text-blue-200">
                {step.a} {displayOp(step.op)} {step.b} = <span className="text-white font-bold">{step.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distance indicator */}
      {currentAnswer !== null && !submitted && (
        <div className="text-center">
          <div className={distance === 0 ? 'text-green-400' : 'text-blue-300'}>
            <span className="text-sm">Current: </span>
            <span className="text-2xl font-bold text-white">{currentAnswer}</span>
            {distance !== null && distance > 0 && (
              <span className="text-sm ml-2">(off by {distance})</span>
            )}
            {distance === 0 && (
              <span className="text-sm ml-2 text-green-400">Exact!</span>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!submitted && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={steps.length === 0 && selectedFirst === null}
          >
            Clear
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

function applyOp(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': {
      const result = a - b;
      return result > 0 ? result : null;
    }
    case '*': return a * b;
    case '/': return b !== 0 && a % b === 0 ? a / b : null;
    default: return null;
  }
}
