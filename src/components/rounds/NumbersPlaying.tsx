import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState } from '../../types/game';
import {
  evaluateExpression,
  isExpressionComplete,
  displayOp,
  type ExprItem,
} from '../../engine/expressionEval';

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [submitted, setSubmitted] = useState(false);

  // Track which tiles are used (by index into round.numbers)
  const [usedTiles, setUsedTiles] = useState<Set<number>>(() => new Set());
  // The expression line items
  const [expr, setExpr] = useState<ExprItem[]>([]);
  // Drag state for reordering
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Evaluate current expression
  const evalResult = isExpressionComplete(expr) ? evaluateExpression(expr) : null;
  const currentAnswer = evalResult?.value ?? null;
  const distance = currentAnswer !== null ? Math.abs(currentAnswer - round.target) : null;

  const handleSubmit = useCallback(() => {
    if (!submitted && evalResult) {
      setSubmitted(true);
      dispatch({
        type: 'SUBMIT_NUMBERS_ANSWER',
        answer: evalResult.value,
        steps: evalResult.steps,
      });
    }
  }, [submitted, evalResult, dispatch]);

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
      if (evalResult) {
        dispatch({
          type: 'SUBMIT_NUMBERS_ANSWER',
          answer: evalResult.value,
          steps: evalResult.steps,
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

  // Tap a number tile to add to expression line
  const handleTileTap = (tileIndex: number) => {
    if (submitted || usedTiles.has(tileIndex)) return;
    const value = round.numbers[tileIndex];
    setExpr([...expr, { type: 'number', value, tileIndex }]);
    setUsedTiles(new Set([...usedTiles, tileIndex]));
  };

  // Tap an operator to add to expression line
  const handleOpTap = (op: '+' | '-' | '*' | '/') => {
    if (submitted) return;
    setExpr([...expr, { type: 'op', value: op }]);
  };

  // Tap parenthesis
  const handleParenTap = (paren: '(' | ')') => {
    if (submitted) return;
    setExpr([...expr, { type: 'paren', value: paren }]);
  };

  // Undo last item
  const handleUndo = () => {
    if (submitted || expr.length === 0) return;
    const last = expr[expr.length - 1];
    const newExpr = expr.slice(0, -1);
    setExpr(newExpr);
    // If it was a number, restore the tile
    if (last.type === 'number') {
      const newUsed = new Set(usedTiles);
      newUsed.delete(last.tileIndex);
      setUsedTiles(newUsed);
    }
  };

  // Clear all
  const handleClear = () => {
    if (submitted) return;
    setExpr([]);
    setUsedTiles(new Set());
  };

  // Remove item from expression line by index
  const handleExprItemRemove = (index: number) => {
    if (submitted) return;
    const item = expr[index];
    const newExpr = [...expr];
    newExpr.splice(index, 1);
    setExpr(newExpr);
    if (item.type === 'number') {
      const newUsed = new Set(usedTiles);
      newUsed.delete(item.tileIndex);
      setUsedTiles(newUsed);
    }
  };

  // Drag and drop reordering on expression line
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newExpr = [...expr];
    const [moved] = newExpr.splice(dragIndex, 1);
    newExpr.splice(targetIndex, 0, moved);
    setExpr(newExpr);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Touch drag state for mobile
  const touchState = useRef<{
    index: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = { index, startX: touch.clientX, startY: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState.current) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchState.current.startX);
    const dy = Math.abs(touch.clientY - touchState.current.startY);
    // If barely moved, treat as tap-to-remove
    if (dx < 10 && dy < 10) {
      handleExprItemRemove(touchState.current.index);
    }
    touchState.current = null;
  };

  const ops: ('+' | '-' | '*' | '/')[] = ['+', '-', '*', '/'];

  // Render an expression item
  const renderExprItem = (item: ExprItem, key: string) => {
    if (item.type === 'number') {
      const isOriginal = item.tileIndex < round.numbers.length;
      const isLarge = item.value >= 25 && isOriginal;
      return (
        <span
          key={key}
          className={`
            inline-flex items-center justify-center px-3 py-2 rounded-lg font-bold text-lg
            ${isOriginal
              ? isLarge
                ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628]'
                : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white'
              : 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white'
            }
            min-w-[2.5rem]
          `}
        >
          {item.value}
        </span>
      );
    }
    if (item.type === 'op') {
      return (
        <span
          key={key}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#fbbf24] text-[#0a1628] font-bold text-lg"
        >
          {displayOp(item.value)}
        </span>
      );
    }
    // paren
    return (
      <span
        key={key}
        className="inline-flex items-center justify-center w-7 h-9 text-[#fbbf24] font-bold text-2xl"
      >
        {item.value}
      </span>
    );
  };

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
        {round.numbers.map((num, i) => {
          const isUsed = usedTiles.has(i);
          return (
            <button
              key={i}
              onClick={() => handleTileTap(i)}
              disabled={submitted || isUsed}
              className={`
                w-16 h-16 rounded-lg font-bold text-2xl flex items-center justify-center
                border-2 shadow-lg transition-all duration-200
                ${isUsed
                  ? 'bg-[#1a2d50]/30 text-[#1a2d50]/20 border-[#2a4a7f]/20 scale-90'
                  : num >= 25
                    ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628] border-[#fbbf24]/60 hover:border-[#fbbf24] cursor-pointer active:scale-95'
                    : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-[#3b82f6]/40 hover:border-[#3b82f6] cursor-pointer active:scale-95'
                }
                ${submitted ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isUsed ? '' : num}
            </button>
          );
        })}
      </div>

      {/* Expression line */}
      <div className="bg-[#0f1d32] border-2 border-[#2a4a7f]/50 rounded-xl p-3 w-full max-w-lg min-h-16 flex items-center gap-1.5 flex-wrap">
        {expr.length === 0 ? (
          <span className="text-blue-400/40 text-sm w-full text-center">
            Tap numbers and operators to build your expression
          </span>
        ) : (
          expr.map((item, i) => (
            <div
              key={i}
              draggable={!submitted}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchEnd={handleTouchEnd}
              onClick={() => !submitted && handleExprItemRemove(i)}
              className={`
                cursor-pointer transition-all duration-150
                ${dragIndex === i ? 'opacity-30 scale-90' : ''}
                ${dragOverIndex === i && dragIndex !== i ? 'translate-x-2' : ''}
                hover:opacity-70
              `}
              title="Click to remove"
            >
              {renderExprItem(item, `expr-${i}`)}
            </div>
          ))
        )}
      </div>

      {/* Live evaluation result */}
      {expr.length > 0 && (
        <div className="text-center min-h-8">
          {evalResult ? (
            <div className={distance === 0 ? 'text-green-400' : 'text-blue-300'}>
              <span className="text-sm">= </span>
              <span className="text-2xl font-bold text-white">{evalResult.value}</span>
              {distance !== null && distance > 0 && (
                <span className="text-sm ml-2">(off by {distance})</span>
              )}
              {distance === 0 && (
                <span className="text-sm ml-2 text-green-400">Exact!</span>
              )}
            </div>
          ) : isExpressionComplete(expr) ? (
            <span className="text-red-400 text-sm">Invalid expression</span>
          ) : (
            <span className="text-blue-400/50 text-sm">...</span>
          )}
        </div>
      )}

      {/* Operators and parentheses */}
      {!submitted && (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleParenTap('(')}
            className="w-11 h-11 rounded-lg bg-[#1a2d50] border border-[#2a4a7f] text-[#fbbf24] font-bold text-xl
              hover:bg-[#2a4a7f] cursor-pointer active:scale-95 transition-all"
          >
            (
          </button>
          {ops.map((op) => (
            <button
              key={op}
              onClick={() => handleOpTap(op)}
              className="w-12 h-12 rounded-full font-bold text-xl flex items-center justify-center
                bg-[#2a4a7f] text-white hover:bg-[#3b82f6] cursor-pointer active:scale-95 transition-all"
            >
              {displayOp(op)}
            </button>
          ))}
          <button
            onClick={() => handleParenTap(')')}
            className="w-11 h-11 rounded-lg bg-[#1a2d50] border border-[#2a4a7f] text-[#fbbf24] font-bold text-xl
              hover:bg-[#2a4a7f] cursor-pointer active:scale-95 transition-all"
          >
            )
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!submitted && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={expr.length === 0}
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            disabled={expr.length === 0}
          >
            Undo
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleSubmit}
            disabled={!evalResult}
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
