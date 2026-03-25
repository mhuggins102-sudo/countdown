import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { NumberTile } from '../shared/NumberTile';
import { Button } from '../shared/Button';
import { createNumberPool, drawLargeNumber, drawSmallNumber, aiPickNumberType, type NumberPool } from '../../engine/letterPicker';
import type { NumbersRoundState } from '../../types/game';

export function NumbersPicking() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const poolRef = useRef<NumberPool>(createNumberPool());

  const canPickLarge = round.largeCount < 4 && round.numbers.length < 6;
  const canPickSmall = round.numbers.length < 6;

  const pickNumber = useCallback((type: 'large' | 'small') => {
    const pool = poolRef.current;
    if (type === 'large') {
      const { number, pool: newPool } = drawLargeNumber(pool);
      poolRef.current = newPool;
      dispatch({ type: 'PICK_NUMBER', number, isLarge: true });
    } else {
      const { number, pool: newPool } = drawSmallNumber(pool);
      poolRef.current = newPool;
      dispatch({ type: 'PICK_NUMBER', number, isLarge: false });
    }
  }, [dispatch]);

  // AI auto-picks numbers one at a time
  useEffect(() => {
    if (!round.isPlayerPicking && round.numbers.length < 6) {
      const timer = setTimeout(() => {
        const choice = aiPickNumberType(
          round.numbers,
          round.largeCount,
          round.smallCount,
          state.difficulty,
        );
        pickNumber(choice);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [round.isPlayerPicking, round.numbers.length, round.largeCount, round.smallCount, state.difficulty, pickNumber]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-blue-300">
        {round.isPlayerPicking ? 'Pick your numbers' : 'AI is picking numbers...'}
      </h2>

      {/* Number tiles revealed so far — 3/3 layout */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            i < round.numbers.length
              ? <NumberTile key={i} number={round.numbers[i]} isLarge={round.numbers[i] >= 25} animate={i === round.numbers.length - 1} index={0} />
              : <div key={`empty-${i}`} className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2a4a7f]/50" />
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          {[3, 4, 5].map((i) => (
            i < round.numbers.length
              ? <NumberTile key={i} number={round.numbers[i]} isLarge={round.numbers[i] >= 25} animate={i === round.numbers.length - 1} index={0} />
              : <div key={`empty-${i}`} className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2a4a7f]/50" />
          ))}
        </div>
      </div>

      <div className="text-sm text-blue-400">
        {round.largeCount} large, {round.smallCount} small
      </div>

      {/* Pick buttons (only when player is picking) */}
      {round.isPlayerPicking && round.numbers.length < 6 && (
        <div className="flex gap-4">
          <Button
            variant="gold"
            size="lg"
            onClick={() => pickNumber('large')}
            disabled={!canPickLarge}
          >
            Large
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => pickNumber('small')}
            disabled={!canPickSmall}
          >
            Small
          </Button>
        </div>
      )}

      {round.isPlayerPicking && (
        <p className="text-blue-400/60 text-xs">
          Large: 25, 50, 75, 100 (max 4) &middot; Small: 1-10
        </p>
      )}
    </div>
  );
}
