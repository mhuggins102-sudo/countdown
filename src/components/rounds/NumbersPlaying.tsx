import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState, SolutionStep } from '../../types/game';
import { NUMBERS_TIMER_DURATION } from '../../types/game';
import { displayOp } from '../../engine/expressionEval';

type Op = '+' | '-' | '*' | '/';

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [submitted, setSubmitted] = useState(false);

  // Fixed 6-slot grid: result replaces one of the used slots, the other becomes null
  const [slots, setSlots] = useState<(number | null)[]>(() => [...round.numbers]);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<number | null>(null);
  const [selectedOp, setSelectedOp] = useState<Op | null>(null);

  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const currentAnswer = lastStep ? lastStep.result : null;
  const distance = currentAnswer !== null ? Math.abs(currentAnswer - round.target) : null;

  // Check if all numbers have been consumed (only 1 non-null slot remaining)
  const nonNullCount = slots.filter((s) => s !== null).length;
  const allUsed = nonNullCount <= 1;

  const doSubmit = useCallback((timerExpired: boolean) => {
    if (submitted) return;
    setSubmitted(true);
    // On timer expiry, only submit if all numbers were used
    const answer = timerExpired && !allUsed ? -9999 : (currentAnswer ?? -9999);
    const submittedSteps = timerExpired && !allUsed ? [] : steps;
    dispatch({
      type: 'SUBMIT_NUMBERS_ANSWER',
      answer,
      steps: submittedSteps,
    });
  }, [submitted, allUsed, currentAnswer, steps, dispatch]);

  useEffect(() => {
    if (submitted && state.phase === 'playing') {
      const timer = setTimeout(() => {
        dispatch({ type: 'TIMER_EXPIRED' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, state.phase, dispatch]);

  useTimer(() => doSubmit(true));

  const handleNumberTap = (index: number) => {
    if (submitted || slots[index] === null) return;

    if (selectedFirst === null) {
      setSelectedFirst(index);
    } else if (selectedOp === null) {
      // No operator yet — toggle or switch selection
      setSelectedFirst(index === selectedFirst ? null : index);
    } else {
      if (index === selectedFirst) return;
      const a = slots[selectedFirst]!;
      const b = slots[index]!;
      const result = applyOp(a, selectedOp, b);
      if (result === null) {
        setSelectedFirst(null);
        setSelectedOp(null);
        return;
      }
      const step: SolutionStep = { a, op: selectedOp, b, result };
      setSteps([...steps, step]);
      // Place result in the first operand's slot, null out the second
      const newSlots = [...slots];
      newSlots[selectedFirst] = result;
      newSlots[index] = null;
      setSlots(newSlots);
      setSelectedFirst(null);
      setSelectedOp(null);
    }
  };

  const handleOpTap = (op: Op) => {
    if (submitted || selectedFirst === null) return;
    setSelectedOp(op);
  };

  const handleUndo = () => {
    if (submitted || steps.length === 0) return;
    const last = steps[steps.length - 1];
    setSteps(steps.slice(0, -1));
    // Restore: find the slot with the result and put `a` back, find the null that was `b` and restore it
    const newSlots = [...slots];
    // The result is in one of the slots — find it (it equals last.result and was placed at selectedFirst's position)
    // We need to track which slots were used. Since result replaced the first operand's slot,
    // we find the slot with the result value and restore a, then find a null slot and restore b.
    // To be precise, we stored result at first operand's index. We'll find it by value match.
    let restoredResult = false;
    let restoredB = false;
    for (let i = 0; i < newSlots.length; i++) {
      if (!restoredResult && newSlots[i] === last.result) {
        newSlots[i] = last.a;
        restoredResult = true;
      } else if (!restoredB && newSlots[i] === null) {
        newSlots[i] = last.b;
        restoredB = true;
      }
    }
    setSlots(newSlots);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const handleClear = () => {
    if (submitted) return;
    setSlots([...round.numbers]);
    setSteps([]);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const ops: Op[] = ['+', '-', '*', '/'];
  const topRow = slots.slice(0, 4);
  const bottomRow = slots.slice(4, 6);

  return (
    <div className="flex flex-col items-center gap-4">
      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} totalTime={NUMBERS_TIMER_DURATION} />

      {/* Target */}
      <div className="bg-[#1a2d50] rounded-xl px-8 py-3">
        <div className="text-sm text-blue-400 mb-1">Target</div>
        <div className="text-5xl font-bold text-[#fbbf24] tabular-nums">{round.target}</div>
      </div>

      {/* Number tiles: 4 on top, 3 on bottom (2 numbers + gap center) */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2 justify-center">
          {topRow.map((num, i) => renderTile(num, i, i, selectedFirst, slots, round, submitted, handleNumberTap))}
        </div>
        <div className="flex gap-2 justify-center">
          {bottomRow.map((num, i) => renderTile(num, i + 4, i + 4, selectedFirst, slots, round, submitted, handleNumberTap))}
        </div>
      </div>

      {/* Current selection indicator */}
      {!submitted && (selectedFirst !== null || selectedOp !== null) && (
        <div className="flex items-center gap-2 text-lg text-white bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-lg px-4 py-2">
          {selectedFirst !== null && slots[selectedFirst] !== null && (
            <span className="font-bold text-[#fbbf24]">{slots[selectedFirst]}</span>
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
            onClick={() => doSubmit(false)}
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

function renderTile(
  num: number | null,
  slotIndex: number,
  _key: number,
  selectedFirst: number | null,
  slots: (number | null)[],
  round: NumbersRoundState,
  submitted: boolean,
  onTap: (index: number) => void,
) {
  if (num === null) {
    return (
      <div
        key={slotIndex}
        className="w-16 h-16 rounded-lg bg-[#1a2d50]/30 border-2 border-[#2a4a7f]/20"
      />
    );
  }
  const isOriginal = slotIndex < round.numbers.length && num === round.numbers[slotIndex];
  const isResult = !isOriginal;
  const isSelected = selectedFirst === slotIndex;
  const isLarge = !isResult && num >= 25;
  // Check if this slot originally had a different value (meaning it's been replaced with a result)
  const wasReplaced = slotIndex < round.numbers.length && slots[slotIndex] !== round.numbers[slotIndex];

  return (
    <button
      key={slotIndex}
      onClick={() => onTap(slotIndex)}
      disabled={submitted}
      className={`
        w-16 h-16 rounded-lg font-bold text-2xl flex items-center justify-center
        border-2 shadow-lg transition-all duration-200
        ${isSelected ? 'ring-4 ring-[#fbbf24] border-[#fbbf24] scale-105' : ''}
        ${isResult || wasReplaced
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
