import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { LetterTile } from '../shared/LetterTile';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import { aiSolveConundrum } from '../../engine/aiOpponent';
import type { ConundrumRoundState } from '../../types/game';

export function ConundrumPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as ConundrumRoundState;
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const aiResultRef = useRef<{ solved: boolean; guessTime: number } | null>(null);

  // Calculate AI conundrum result on mount
  useEffect(() => {
    if (state.mode === 'fullgame' && !aiResultRef.current) {
      aiResultRef.current = aiSolveConundrum(state.difficulty);
    }
  }, [state.mode, state.difficulty]);

  const handleSubmit = useCallback(() => {
    if (input.length > 0 && !submitted) {
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_CONUNDRUM_GUESS', guess: input });
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
      dispatch({ type: 'SUBMIT_CONUNDRUM_GUESS', guess: input });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-[#fbbf24]">CONUNDRUM</h2>

      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} />

      {/* Scrambled letters */}
      <div className="flex gap-2 flex-wrap justify-center">
        {round.scrambled.split('').map((letter, i) => (
          <LetterTile key={i} letter={letter} size="lg" animate index={i} />
        ))}
      </div>

      <p className="text-blue-300 text-sm">Unscramble the 9 letters to find the word!</p>

      {/* Word input */}
      {!submitted ? (
        <div className="flex flex-col items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 9))}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            maxLength={9}
            className="bg-[#1a2d50] border-2 border-[#2a4a7f] rounded-xl px-6 py-3 text-2xl font-bold text-white text-center uppercase tracking-widest w-72 focus:outline-none focus:border-[#3b82f6]"
            autoFocus
          />
          <Button variant="gold" size="lg" onClick={handleSubmit} disabled={input.length === 0}>
            Submit
          </Button>
        </div>
      ) : (
        <p className="text-blue-300 animate-fade-in">
          Your guess: <span className="font-bold text-white">{input}</span>
        </p>
      )}
    </div>
  );
}
