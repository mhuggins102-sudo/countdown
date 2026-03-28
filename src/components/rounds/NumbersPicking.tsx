import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { NumberTile } from '../shared/NumberTile';
import { Button } from '../shared/Button';
import { createNumberPool, drawLargeNumber, drawSmallNumber, aiPickNumberType, type NumberPool } from '../../engine/letterPicker';
import type { NumbersRoundState, Difficulty } from '../../types/game';
import { useChallengeOpponent } from '../../hooks/useChallengeOpponent';
import { submitPicks } from '../../api/liveApi';

const LARGE_NUMS = [25, 50, 75, 100];

export function NumbersPicking() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as NumbersRoundState;
  const poolRef = useRef<NumberPool>(createNumberPool());
  const { hasOpponent, result: opponentResult } = useChallengeOpponent();
  const isChallengeReveal = hasOpponent && !!opponentResult?.numbers?.length;

  // Live mode P2: reveal numbers from host's picks
  const isLiveP2 = state.mode === 'live' && !state.liveData?.isHost;
  const livePicks = state.liveData?.currentPicks;
  const isLiveReveal = isLiveP2 && !!livePicks?.numbers?.length;

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

  // Challenge P2: auto-reveal opponent's numbers one at a time
  useEffect(() => {
    if (isChallengeReveal && round.numbers.length < 6) {
      const nextNum = opponentResult!.numbers![round.numbers.length];
      if (nextNum == null) return;
      const isLarge = LARGE_NUMS.includes(nextNum);
      const timer = setTimeout(() => {
        dispatch({ type: 'PICK_NUMBER', number: nextNum, isLarge });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isChallengeReveal, round.numbers.length, opponentResult, dispatch]);

  // Live host: submit picks to server when all numbers are picked
  const picksSubmitted = useRef(false);
  useEffect(() => {
    if (state.mode === 'live' && state.liveData?.isHost && round.numbers.length === 6 && !picksSubmitted.current) {
      picksSubmitted.current = true;
      submitPicks(state.liveData.code, state.liveData.playerId, {
        roundIndex: state.currentRound,
        roundType: 'numbers',
        numbers: round.numbers,
        target: round.target,
      });
    }
  }, [state.mode, state.liveData, round.numbers.length, round.numbers, round.target, state.currentRound]);

  // Live P2: auto-reveal host's numbers one at a time
  useEffect(() => {
    if (isLiveReveal && round.numbers.length < 6) {
      const nextNum = livePicks!.numbers![round.numbers.length];
      if (nextNum == null) return;
      const isLarge = LARGE_NUMS.includes(nextNum);
      const timer = setTimeout(() => {
        dispatch({ type: 'PICK_NUMBER', number: nextNum, isLarge });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLiveReveal, round.numbers.length, livePicks, dispatch]);

  // AI auto-picks numbers one at a time
  useEffect(() => {
    if (!isChallengeReveal && !round.isPlayerPicking && round.numbers.length < 6) {
      const timer = setTimeout(() => {
        const choice = aiPickNumberType(
          round.numbers,
          round.largeCount,
          round.smallCount,
          state.difficulty as Difficulty,
        );
        pickNumber(choice);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isChallengeReveal, round.isPlayerPicking, round.numbers.length, round.largeCount, round.smallCount, state.difficulty, pickNumber]);

  const heading = isChallengeReveal || isLiveReveal
    ? 'Revealing numbers...'
    : isLiveP2 && !livePicks
      ? 'Waiting for host to pick...'
      : round.isPlayerPicking
        ? 'Pick your numbers'
        : 'AI is picking numbers...';

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-blue-300">{heading}</h2>

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
