import type { Difficulty } from '../types/game';
import { findAllValidWords } from './wordFinder';
import { solveNumbers } from './numbersSolver';

export function aiPickWord(
  letters: string[],
  difficulty: Difficulty,
): string {
  const validWords = findAllValidWords(letters);
  if (validWords.length === 0) return '';

  const longest = validWords[0].length;

  switch (difficulty) {
    case 'easy': {
      // Pick a word 3-5 letters long, or the best if nothing shorter exists
      const shortWords = validWords.filter((w) => w.length >= 3 && w.length <= 5);
      if (shortWords.length > 0) {
        return shortWords[Math.floor(Math.random() * Math.min(5, shortWords.length))];
      }
      return validWords[validWords.length - 1]; // shortest available
    }
    case 'medium': {
      // Pick a word 1-2 letters shorter than the best, or the best 40% of the time
      if (Math.random() < 0.4) return validWords[0];
      const targetLen = Math.max(3, longest - Math.floor(Math.random() * 2) - 1);
      const candidates = validWords.filter((w) => w.length >= targetLen - 1 && w.length <= targetLen);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
      }
      return validWords[Math.min(2, validWords.length - 1)];
    }
    case 'hard': {
      // Pick the best word 70% of the time, second-best 30%
      if (Math.random() < 0.7 || validWords.length === 1) return validWords[0];
      const secondBest = validWords.find((w) => w.length === longest - 1) || validWords[1];
      return secondBest;
    }
  }
}

// Weighted random offset with floor: 0 = exact answer, higher offsets less likely
// P(offset=k) decreases linearly; P(offset=0) ~ (2*max-1)/max²
function weightedOffset(maxOffset: number): number {
  return Math.floor(maxOffset * (1 - Math.sqrt(Math.random())));
}

export function aiPickNumber(
  numbers: number[],
  target: number,
  difficulty: Difficulty,
): number {
  const { closest } = solveNumbers(numbers, target);

  let maxOffset: number;
  switch (difficulty) {
    case 'easy':    maxOffset = 30; break; // ~6.6% exact
    case 'medium':  maxOffset = 20; break; // ~9.8% exact
    case 'hard':    maxOffset = 10; break; // ~19% exact
  }

  const offset = weightedOffset(maxOffset);
  if (offset === 0) return closest;
  const result = closest + (Math.random() < 0.5 ? offset : -offset);
  return Math.max(1, result);
}

export function aiSolveConundrum(
  difficulty: Difficulty,
  timerDuration: number,
): { solved: boolean; guessTime: number } {
  const is60 = timerDuration >= 60;
  let solveChance: number;
  let minTime: number;
  let maxTime: number;

  switch (difficulty) {
    case 'easy':
      solveChance = is60 ? 0.3 : 0.2;
      minTime = 20;
      maxTime = timerDuration;
      break;
    case 'medium':
      solveChance = is60 ? 0.7 : 0.5;
      minTime = 15;
      maxTime = timerDuration;
      break;
    case 'hard':
      solveChance = is60 ? 0.9 : 0.8;
      minTime = 10;
      maxTime = timerDuration;
      break;
  }

  const solved = Math.random() < solveChance;
  if (!solved) return { solved: false, guessTime: 0 };
  // Weighted toward minTime using floor-based sqrt distribution
  const guessTime = minTime + Math.floor((maxTime - minTime) * (1 - Math.sqrt(Math.random())));

  return { solved, guessTime };
}
