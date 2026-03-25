import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { NumberTile } from '../shared/NumberTile';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { NumbersRoundState } from '../../types/game';

export function NumbersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    const num = parseInt(input, 10);
    if (!isNaN(num) && !submitted) {
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_NUMBERS_ANSWER', answer: num });
    }
  }, [input, submitted, dispatch]);

  // When submitted, wait briefly then transition to reveal
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TIMER_EXPIRED' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, dispatch]);

  useTimer(() => {
    if (!submitted) {
      setSubmitted(true);
      const num = parseInt(input, 10);
      if (!isNaN(num)) {
        dispatch({ type: 'SUBMIT_NUMBERS_ANSWER', answer: num });
      }
    }
  });

  const handleKeypad = (digit: string) => {
    if (submitted) return;
    if (digit === 'clear') {
      setInput('');
    } else if (digit === 'back') {
      setInput(input.slice(0, -1));
    } else {
      if (input.length < 4) setInput(input + digit);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} />

      {/* Target */}
      <div className="bg-[#1a2d50] rounded-xl px-8 py-4">
        <div className="text-sm text-blue-400 mb-1">Target</div>
        <div className="text-5xl font-bold text-[#fbbf24] tabular-nums">{round.target}</div>
      </div>

      {/* Number tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {round.numbers.map((num, i) => (
          <NumberTile
            key={i}
            number={num}
            isLarge={num >= 25}
            animate
            index={i}
          />
        ))}
      </div>

      {/* Answer input */}
      <div className="bg-[#1a2d50] rounded-xl px-6 py-3 min-w-48 text-center">
        <div className="text-sm text-blue-400 mb-1">Your answer</div>
        <div className="text-4xl font-bold text-white tabular-nums min-h-12">
          {input || <span className="text-blue-400/30">---</span>}
        </div>
      </div>

      {/* Keypad */}
      {!submitted && (
        <div className="grid grid-cols-3 gap-2 w-56">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
            <button
              key={key}
              onClick={() => handleKeypad(key)}
              className={`
                py-3 rounded-lg font-semibold text-lg transition-all
                ${key === 'clear' || key === 'back'
                  ? 'bg-[#1a2d50] text-blue-300 hover:bg-[#2a4a7f] text-sm'
                  : 'bg-[#2a4a7f] text-white hover:bg-[#3b82f6]'
                }
                active:scale-95
              `}
            >
              {key === 'back' ? '\u2190' : key === 'clear' ? 'C' : key}
            </button>
          ))}
        </div>
      )}

      <Button
        variant="gold"
        size="lg"
        onClick={handleSubmit}
        disabled={submitted || input.length === 0}
      >
        {submitted ? 'Submitted!' : 'Submit Answer'}
      </Button>

      {submitted && (
        <p className="text-blue-300 animate-fade-in">
          Your answer: <span className="font-bold text-white">{input}</span>
        </p>
      )}
    </div>
  );
}
