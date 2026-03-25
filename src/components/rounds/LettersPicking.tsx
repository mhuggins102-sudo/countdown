import { useEffect, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { LetterTile } from '../shared/LetterTile';
import { Button } from '../shared/Button';
import { createPool, drawConsonant, drawVowel, aiPickLetters, type LetterPool } from '../../engine/letterPicker';
import { useRef } from 'react';
import type { LettersRoundState, Difficulty } from '../../types/game';

export function LettersPicking() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as LettersRoundState;
  const poolRef = useRef<LetterPool>(createPool());

  const canPickVowel = round.vowelCount < 5 && round.letters.length < 9;
  const canPickConsonant = round.consonantCount < 6 && round.letters.length < 9;

  // Enforce minimums: if remaining picks exactly equals what's needed
  const remaining = 9 - round.letters.length;
  const needVowels = Math.max(0, 3 - round.vowelCount);
  const needConsonants = Math.max(0, 4 - round.consonantCount);
  const mustPickVowel = remaining <= needVowels && needVowels > 0;
  const mustPickConsonant = remaining <= needConsonants && needConsonants > 0;

  const pickLetter = useCallback((type: 'consonant' | 'vowel') => {
    const pool = poolRef.current;
    if (type === 'consonant') {
      const { letter, pool: newPool } = drawConsonant(pool);
      poolRef.current = newPool;
      dispatch({ type: 'PICK_LETTER', letter, isConsonant: true });
    } else {
      const { letter, pool: newPool } = drawVowel(pool);
      poolRef.current = newPool;
      dispatch({ type: 'PICK_LETTER', letter, isConsonant: false });
    }
  }, [dispatch]);

  // AI auto-picks letters when it's the AI's turn
  useEffect(() => {
    if (!round.isPlayerPicking && round.letters.length < 9) {
      const timer = setTimeout(() => {
        const choice = aiPickLetters(
          round.letters,
          round.consonantCount,
          round.vowelCount,
          state.difficulty,
        );
        pickLetter(choice);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [round.isPlayerPicking, round.letters.length, round.consonantCount, round.vowelCount, state.difficulty, pickLetter]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-blue-300">
        {round.isPlayerPicking ? 'Pick your letters' : 'AI is picking letters...'}
      </h2>

      {/* Letter tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {round.letters.map((letter, i) => (
          <LetterTile key={i} letter={letter} size="lg" animate index={i} />
        ))}
        {Array.from({ length: 9 - round.letters.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2a4a7f]/50"
          />
        ))}
      </div>

      <div className="text-sm text-blue-400">
        {round.consonantCount} consonants, {round.vowelCount} vowels
      </div>

      {/* Pick buttons (only when player is picking) */}
      {round.isPlayerPicking && round.letters.length < 9 && (
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => pickLetter('consonant')}
            disabled={!canPickConsonant || mustPickVowel}
          >
            Consonant
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={() => pickLetter('vowel')}
            disabled={!canPickVowel || mustPickConsonant}
          >
            Vowel
          </Button>
        </div>
      )}
    </div>
  );
}
