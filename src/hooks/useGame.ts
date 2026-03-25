import { useContext } from 'react';
import { GameContext } from '../state/GameContext';

export function useGame() {
  return useContext(GameContext);
}
