import { useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { BtcTimer } from './BtcTimer';
import { BtcLettersPlaying } from './BtcLettersPlaying';
import { BtcNumbersPlaying } from './BtcNumbersPlaying';
import { BtcConundrumPlaying } from './BtcConundrumPlaying';

export function BtcScreen() {
  const { state, dispatch } = useGame();
  const intervalRef = useRef<number | null>(null);
  const roundType = state.currentRoundState?.type;

  // Global BTC timer tick
  useEffect(() => {
    if (state.timerRunning && state.timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.timerRunning, dispatch]);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-blue-400 uppercase tracking-wider">Beat the Clock</div>
          <div className="text-sm text-blue-300 capitalize">{state.btcMode} mode</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-blue-400">Rounds</div>
          <div className="text-2xl font-bold text-[#fbbf24] tabular-nums">{state.btcRoundsCompleted}</div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <BtcTimer
          timeRemaining={state.timeRemaining}
          isRunning={state.timerRunning}
        />
      </div>

      {/* Round type indicator */}
      {roundType && roundType !== 'conundrum' && (
        <div className="text-center mb-4">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{roundType}</span>
        </div>
      )}

      {/* Playing area */}
      <div className="mt-2">
        {roundType === 'letters' && <BtcLettersPlaying key={state.btcRoundKey} />}
        {roundType === 'numbers' && <BtcNumbersPlaying key={state.btcRoundKey} />}
        {roundType === 'conundrum' && <BtcConundrumPlaying key={state.btcRoundKey} />}
      </div>
    </div>
  );
}
