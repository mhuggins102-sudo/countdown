import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState, SolutionStep } from '../../types/game';

type Op = '+' | '-' | '*' | '/';

interface Tile {
  value: number;
  isResult: boolean;
  isLarge: boolean;
}

function displayOp(op: Op): string {
  switch (op) {
    case '*': return '\u00D7';
    case '/': return '\u00F7';
    default: return op;
  }
}

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [submitted, setSubmitted] = useState(false);

  const [tiles, setTiles] = useState<Tile[]>(() =>
    round.numbers.map((n) => ({ value: n, isResult: false, isLarge: n >= 25 }))
  );
  const [history, setHistory] = useState<Tile[][]>([]);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<number | null>(null);
  const [selectedOp, setSelectedOp] = useState<Op | null>(null);

  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const currentAnswer = lastStep ? lastStep.result : null;
  const allUsed = tiles.length <= 1;

  const doSubmit = useCallback((timerExpired: boolean) => {
    if (submitted) return;
    setSubmitted(true);
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
    if (submitted) return;

    if (selectedFirst === null) {
      setSelectedFirst(index);
    } else if (selectedOp === null) {
      setSelectedFirst(index === selectedFirst ? null : index);
    } else {
      if (index === selectedFirst) return;
      const a = tiles[selectedFirst].value;
      const b = tiles[index].value;
      const result = applyOp(a, selectedOp, b);
      if (result === null) {
        setSelectedFirst(null);
        setSelectedOp(null);
        return;
      }
      const step: SolutionStep = { a, op: selectedOp, b, result };
      // Save current state for undo
      setHistory([...history, [...tiles]]);
      setSteps([...steps, step]);
      // Remove both tiles, insert result at the earlier position
      const minIdx = Math.min(selectedFirst, index);
      const maxIdx = Math.max(selectedFirst, index);
      const newTiles = [...tiles];
      // Remove higher index first to preserve lower index
      newTiles.splice(maxIdx, 1);
      newTiles.splice(minIdx, 1);
      // Insert result at minIdx
      newTiles.splice(minIdx, 0, { value: result, isResult: true, isLarge: false });
      setTiles(newTiles);
      // Keep the new result tile selected so the player can chain operations
      setSelectedFirst(minIdx);
      setSelectedOp(null);
    }
  };

  const handleOpTap = (op: Op) => {
    if (submitted || selectedFirst === null) return;
    setSelectedOp(op);
  };

  const handleUndo = () => {
    if (submitted || history.length === 0) return;
    setTiles(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSteps(steps.slice(0, -1));
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const handleClear = () => {
    if (submitted) return;
    setTiles(round.numbers.map((n) => ({ value: n, isResult: false, isLarge: n >= 25 })));
    setHistory([]);
    setSteps([]);
    setSelectedFirst(null);
    setSelectedOp(null);
  };

  const ops: Op[] = ['+', '-', '*', '/'];
  const topRow = tiles.slice(0, Math.min(3, tiles.length));
  const bottomRow = tiles.length > 3 ? tiles.slice(3) : [];

  return (
    <div className="flex flex-col items-center gap-4">
      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} totalTime={state.timerDuration} />

      {/* Target */}
      <div className="bg-[#1a2d50] rounded-xl px-8 py-3">
        <div className="text-sm text-blue-400 mb-1">Target</div>
        <div className="text-5xl font-bold text-[#fbbf24] tabular-nums">{round.target}</div>
      </div>

      {/* Number tiles: up to 4 on top, rest on bottom */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2 justify-center">
          {topRow.map((tile, i) => (
            <TileButton
              key={`${i}-${tile.value}`}
              tile={tile}
              index={i}
              isSelected={selectedFirst === i}
              submitted={submitted}
              onTap={handleNumberTap}
            />
          ))}
        </div>
        {bottomRow.length > 0 && (
          <div className="flex gap-2 justify-center">
            {bottomRow.map((tile, i) => {
              const actualIndex = i + 3;
              return (
                <TileButton
                  key={`${actualIndex}-${tile.value}`}
                  tile={tile}
                  index={actualIndex}
                  isSelected={selectedFirst === actualIndex}
                  submitted={submitted}
                  onTap={handleNumberTap}
                />
              );
            })}
          </div>
        )}
      </div>

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

function TileButton({
  tile,
  index,
  isSelected,
  submitted,
  onTap,
}: {
  tile: Tile;
  index: number;
  isSelected: boolean;
  submitted: boolean;
  onTap: (index: number) => void;
}) {
  return (
    <button
      onClick={() => onTap(index)}
      disabled={submitted}
      className={`
        w-16 h-16 rounded-lg font-bold text-2xl flex items-center justify-center
        border-2 shadow-lg transition-all duration-200
        ${isSelected ? 'ring-4 ring-[#fbbf24] border-[#fbbf24] scale-105' : ''}
        ${tile.isResult
          ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white border-[#22c55e]/60 hover:border-[#22c55e] cursor-pointer active:scale-95'
          : tile.isLarge
            ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628] border-[#fbbf24]/60 hover:border-[#fbbf24] cursor-pointer active:scale-95'
            : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-[#3b82f6]/40 hover:border-[#3b82f6] cursor-pointer active:scale-95'
        }
        ${submitted ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {tile.value}
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
