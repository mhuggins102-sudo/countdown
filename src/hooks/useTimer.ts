import { useEffect, useRef } from 'react';
import { useGame } from './useGame';

export function useTimer(onExpired?: () => void) {
  const { state, dispatch } = useGame();
  const intervalRef = useRef<number | null>(null);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

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

  useEffect(() => {
    if (state.timeRemaining === 0 && !state.timerRunning) {
      onExpiredRef.current?.();
    }
  }, [state.timeRemaining, state.timerRunning]);

  return {
    timeRemaining: state.timeRemaining,
    isRunning: state.timerRunning,
  };
}
