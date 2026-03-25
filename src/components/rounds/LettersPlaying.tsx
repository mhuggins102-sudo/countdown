import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { LetterTile } from '../shared/LetterTile';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import type { LettersRoundState } from '../../types/game';

export function LettersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as LettersRoundState;
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const currentWord = selectedIndices.map((i) => round.letters[i]).join('');

  const handleSubmit = useCallback(() => {
    if (currentWord.length > 0 && !submitted) {
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_LETTERS_WORD', word: currentWord });
    }
  }, [currentWord, submitted, dispatch]);

  // When submitted manually, wait briefly then transition to reveal
  useEffect(() => {
    if (submitted && state.phase === 'playing') {
      const timer = setTimeout(() => {
        dispatch({ type: 'TIMER_EXPIRED' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, state.phase, dispatch]);

  // When timer runs out naturally
  useTimer(() => {
    if (!submitted) {
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_LETTERS_WORD', word: currentWord });
      // Dispatch TIMER_EXPIRED immediately (the useEffect above will handle reveal)
    }
  });

  const handleTileClick = (index: number) => {
    if (submitted) return;
    if (selectedIndices.includes(index)) {
      // Deselect: remove this and all tiles after it
      const pos = selectedIndices.indexOf(index);
      setSelectedIndices(selectedIndices.slice(0, pos));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleUndo = () => {
    if (selectedIndices.length > 0 && !submitted) {
      setSelectedIndices(selectedIndices.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!submitted) {
      setSelectedIndices([]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} />

      {/* Available letter tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {round.letters.map((letter, i) => (
          <LetterTile
            key={i}
            letter={letter}
            size="lg"
            selected={selectedIndices.includes(i)}
            onClick={() => handleTileClick(i)}
            disabled={submitted}
          />
        ))}
      </div>

      {/* Current word display */}
      <div className="min-h-16 flex items-center gap-1">
        {currentWord.length > 0 ? (
          <div className="flex gap-1">
            {currentWord.split('').map((letter, i) => (
              <span
                key={i}
                className="w-10 h-10 bg-[#fbbf24] text-[#0a1628] rounded font-bold text-xl flex items-center justify-center"
              >
                {letter}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-blue-400/50 text-lg">Click tiles to spell your word</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={handleClear} disabled={submitted || selectedIndices.length === 0}>
          Clear
        </Button>
        <Button variant="secondary" size="sm" onClick={handleUndo} disabled={submitted || selectedIndices.length === 0}>
          Undo
        </Button>
        <Button variant="gold" size="lg" onClick={handleSubmit} disabled={submitted || currentWord.length === 0}>
          {submitted ? 'Submitted!' : 'Submit Word'}
        </Button>
      </div>

      {submitted && (
        <p className="text-blue-300 animate-fade-in">
          Your word: <span className="font-bold text-white">{currentWord}</span> ({currentWord.length} letters)
        </p>
      )}
    </div>
  );
}
