import { useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { aiPickLargeCount } from '../../engine/letterPicker';
import type { NumbersRoundState } from '../../types/game';

export function NumbersPicking() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;

  // AI auto-picks large count
  useEffect(() => {
    if (!round.isPlayerPicking && round.largeCount === -1) {
      const timer = setTimeout(() => {
        const count = aiPickLargeCount(state.difficulty);
        dispatch({ type: 'PICK_LARGE_COUNT', count });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [round.isPlayerPicking, round.largeCount, state.difficulty, dispatch]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-blue-300">
        {round.isPlayerPicking ? 'How many large numbers?' : 'AI is choosing...'}
      </h2>

      <p className="text-blue-400 text-sm">
        Large numbers: 25, 50, 75, 100. The rest will be small (1-10).
      </p>

      {round.isPlayerPicking && (
        <div className="flex gap-3">
          {[0, 1, 2, 3, 4].map((count) => (
            <Button
              key={count}
              variant={count === 2 ? 'gold' : 'secondary'}
              size="lg"
              onClick={() => dispatch({ type: 'PICK_LARGE_COUNT', count })}
            >
              {count} large
            </Button>
          ))}
        </div>
      )}

      {!round.isPlayerPicking && (
        <div className="text-blue-300 animate-pulse">Selecting...</div>
      )}
    </div>
  );
}
