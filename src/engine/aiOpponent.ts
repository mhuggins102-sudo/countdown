import type { Difficulty, SolutionStep } from '../types/game';
import { findAllValidWords } from './wordFinder';
import { solveNumbers, solveForTarget } from './numbersSolver';

export function aiPickWord(
  letters: string[],
  difficulty: Difficulty,
): string {
  const validWords = findAllValidWords(letters);
  if (validWords.length === 0) return '';

  const longest = validWords[0].length;

  switch (difficulty) {
    case 'easy': {
      // 5% chance of longest word; otherwise 50% three shorter, 30% two shorter, 20% one shorter
      if (Math.random() < 0.05) return validWords[0];
      const r = Math.random();
      const delta = r < 0.5 ? 3 : r < 0.8 ? 2 : 1;
      const targetLen = Math.max(3, longest - delta);
      const candidates = validWords.filter((w) => w.length === targetLen);
      if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
      // Fall back to closest available shorter word
      const shorter = validWords.filter((w) => w.length <= targetLen);
      if (shorter.length > 0) return shorter[0];
      return validWords[validWords.length - 1];
    }
    case 'medium': {
      // 30% chance of longest word; otherwise equally likely 1 or 2 shorter
      if (Math.random() < 0.3) return validWords[0];
      const delta = Math.random() < 0.5 ? 1 : 2;
      const targetLen = Math.max(3, longest - delta);
      const candidates = validWords.filter((w) => w.length === targetLen);
      if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
      const shorter = validWords.filter((w) => w.length <= targetLen);
      if (shorter.length > 0) return shorter[0];
      return validWords[Math.min(2, validWords.length - 1)];
    }
    case 'hard': {
      // 50% chance of longest word; otherwise 75% one shorter, 25% two shorter
      if (Math.random() < 0.5 || validWords.length === 1) return validWords[0];
      const delta = Math.random() < 0.75 ? 1 : 2;
      const targetLen = Math.max(3, longest - delta);
      const candidates = validWords.filter((w) => w.length === targetLen);
      if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
      const shorter = validWords.filter((w) => w.length <= targetLen);
      if (shorter.length > 0) return shorter[0];
      return validWords[0]; // fall back to best
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
): { answer: number; steps: SolutionStep[] } {
  const { closest, steps: bestSteps } = solveNumbers(numbers, target);

  let maxOffset: number;
  switch (difficulty) {
    case 'easy':    maxOffset = 25; break;
    case 'medium':  maxOffset = 15; break;
    case 'hard':    maxOffset = 8;  break;
  }

  const offset = weightedOffset(maxOffset);
  if (offset === 0) return { answer: closest, steps: bestSteps };

  // Try to find steps that produce the intended offset answer
  const sign = Math.random() < 0.5 ? 1 : -1;
  const intendedAnswer = Math.max(1, closest + sign * offset);
  const result = solveForTarget(numbers, intendedAnswer);
  if (result.distance === 0) {
    return { answer: result.value, steps: result.steps };
  }

  // If we can't hit the intended answer exactly, try the other direction
  const altAnswer = Math.max(1, closest - sign * offset);
  const altResult = solveForTarget(numbers, altAnswer);
  if (altResult.distance === 0) {
    return { answer: altResult.value, steps: altResult.steps };
  }

  // Use whichever got closer to its intended target, expanding outward if needed
  const best = result.distance <= altResult.distance ? result : altResult;
  return { answer: best.value, steps: best.steps };
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
