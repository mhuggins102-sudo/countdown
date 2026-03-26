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

export function aiPickNumber(
  numbers: number[],
  target: number,
  difficulty: Difficulty,
): number {
  const { closest } = solveNumbers(numbers, target);

  switch (difficulty) {
    case 'easy': {
      // Rarely gets the exact answer, often far off
      if (Math.random() < 0.1) return closest;
      const offset = Math.floor(Math.random() * 25) + 8;
      const result = closest + (Math.random() < 0.5 ? offset : -offset);
      return Math.max(1, result);
    }
    case 'medium': {
      if (Math.random() < 0.4) return closest;
      const offset = Math.floor(Math.random() * 12) + 3;
      const result = closest + (Math.random() < 0.5 ? offset : -offset);
      return Math.max(1, result);
    }
    case 'hard': {
      if (Math.random() < 0.85) return closest;
      const offset = Math.floor(Math.random() * 3) + 1;
      return closest + (Math.random() < 0.5 ? offset : -offset);
    }
  }
}

export function aiSolveConundrum(
  difficulty: Difficulty,
): { solved: boolean; guessTime: number } {
  let solveChance: number;
  let minTime: number;
  let maxTime: number;

  switch (difficulty) {
    case 'easy':
      solveChance = 0.2;
      minTime = 10;
      maxTime = 25;
      break;
    case 'medium':
      solveChance = 0.5;
      minTime = 5;
      maxTime = 20;
      break;
    case 'hard':
      solveChance = 0.8;
      minTime = 2;
      maxTime = 10;
      break;
  }

  const solved = Math.random() < solveChance;
  const guessTime = minTime + Math.random() * (maxTime - minTime);

  return { solved, guessTime };
}
