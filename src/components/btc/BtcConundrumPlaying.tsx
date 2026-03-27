import { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { LetterTile } from '../shared/LetterTile';
import { Button } from '../shared/Button';
import { isConundrumCorrect } from '../../engine/scoring';
import { CONUNDRUM_BTC_BONUS } from '../../engine/btcGenerator';
import type { ConundrumRoundState } from '../../types/game';

export function BtcConundrumPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as ConundrumRoundState;
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const scrambledLetters = round.scrambled.split('');
  const currentWord = selectedIndices.map((i) => scrambledLetters[i]).join('');

  // Auto-submit when all 9 tiles form a valid answer
  useEffect(() => {
    if (selectedIndices.length === 9) {
      const word = selectedIndices.map((i) => scrambledLetters[i]).join('');
      if (isConundrumCorrect(word, round.answer)) {
        dispatch({ type: 'BTC_SUBMIT', bonus: CONUNDRUM_BTC_BONUS });
      }
    }
  }, [selectedIndices, scrambledLetters, round.answer, dispatch]);

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
      <div className="bg-[#1a2d50] rounded-xl px-6 py-2">
        <span className="text-sm text-purple-400 font-semibold">Conundrum</span>
      </div>

      {/* Scrambled letter tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {scrambledLetters.map((letter, i) => (
          <LetterTile
            key={i}
            letter={letter}
            size="lg"
            selected={selectedIndices.includes(i)}
            onClick={() => handleTileClick(i)}
          />
        ))}
      </div>

      <p className="text-blue-300 text-sm">Unscramble the 9-letter word!</p>

      {/* Current word display */}
      <div className="min-h-14 flex items-center gap-1">
        {currentWord.length > 0 ? (
          <div className="flex gap-1">
            {currentWord.split('').map((letter, i) => (
              <span
                key={i}
                className="w-10 h-10 bg-[#fbbf24] text-[#0a1628] rounded font-bold text-xl flex items-center justify-center"
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-blue-400/50 text-lg">Tap tiles to spell the word</span>
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
      </div>
      <button
        onClick={() => dispatch({ type: 'BTC_SKIP' })}
        className="text-sm text-blue-400/60 hover:text-blue-300 transition-colors"
      >
        Skip (-10s)
      </button>
    </div>
  );
}
