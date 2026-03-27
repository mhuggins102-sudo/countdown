import { useState, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { LetterTile } from '../shared/LetterTile';
import { Button } from '../shared/Button';
import { isValidWord, canFormWord } from '../../engine/wordValidator';
import { lettersBtcBonus } from '../../engine/btcGenerator';
import type { LettersRoundState } from '../../types/game';

export function BtcLettersPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as LettersRoundState;
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [shake, setShake] = useState(false);

  const currentWord = selectedIndices.map((i) => round.letters[i]).join('');
  const wordValid = currentWord.length >= 4
    && isValidWord(currentWord)
    && canFormWord(currentWord, round.letters);

  const handleSubmit = useCallback(() => {
    if (!wordValid) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const bonus = lettersBtcBonus(currentWord.length);
    dispatch({ type: 'BTC_SUBMIT', bonus });
    setSelectedIndices([]);
  }, [wordValid, currentWord.length, dispatch]);

  const handleTileClick = (index: number) => {
    if (selectedIndices.includes(index)) {
      const pos = selectedIndices.indexOf(index);
      setSelectedIndices(selectedIndices.slice(0, pos));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Available letter tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {round.letters.map((letter, i) => (
          <LetterTile
            key={i}
            letter={letter}
            size="lg"
            selected={selectedIndices.includes(i)}
            onClick={() => handleTileClick(i)}
          />
        ))}
      </div>

      {/* Current word display */}
      <div className={`min-h-14 flex items-center gap-1 ${shake ? 'animate-shake' : ''}`}>
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
          <span className="text-blue-400/50 text-lg">Tap tiles to spell a word</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedIndices([])}
          disabled={selectedIndices.length === 0}
        >
          Clear
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedIndices(selectedIndices.slice(0, -1))}
          disabled={selectedIndices.length === 0}
        >
          Undo
        </Button>
        <Button
          variant="gold"
          size="lg"
          onClick={handleSubmit}
          disabled={currentWord.length < 4}
        >
          Submit
        </Button>
      </div>
      <button
        onClick={() => dispatch({ type: 'BTC_SKIP' })}
        className="text-sm text-blue-400/60 hover:text-blue-300 transition-colors"
      >
        Skip (-10s)
      </button>

      {currentWord.length >= 4 && !wordValid && (
        <p className="text-red-400/70 text-sm">Not a valid word</p>
      )}
    </div>
  );
}
